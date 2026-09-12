import "server-only";

import { db } from "@/lib/db";
import type { CanonStatus, QuestStatus, PlotThreadStatus, RelatableEntityType } from "@/generated/prisma/client";
import { getEntityHref } from "@/modules/creation/relationships/config";
import {
  loadAllRelationships,
  groupIdsByType,
  resolveAllEndpoints,
  resolveCanonStatuses,
  entityKey,
} from "@/modules/copilot/shared/relationship-graph";

/**
 * Canon Checker (Fase 8, ver ARCHITECTURE.md, seção 19.2) — verificador
 * heurístico de consistência de STATUS CANÔNICO cruzado entre entidades
 * relacionadas, sem LLM. Puramente regras sobre campos que já existem
 * (`canonStatus`, `archived`, `status` de Missão/Trama) — nenhuma inferência
 * de significado, igual ao Lore Guardian (seção 19.1). Nunca corrige nada
 * sozinho, só sinaliza "isso pode precisar de revisão".
 *
 * Duas checagens, deliberadamente distintas do Lore Guardian (duplicidade/
 * contradição de texto) e do Campaign Health da Fase 7 (atividade/tempo,
 * seção 18.3) — aqui é sempre STATUS canônico cruzado, nunca "quando foi
 * editado pela última vez":
 *
 * 1. `findCanonStatusConflicts` — uma entidade `CANON` relacionada a outra
 *    `OBSOLETE`/`ARCHIVED` (os 7 tipos com `canonStatus`, seção 12.2).
 * 2. `findActiveContentReferencingOutdated` — uma Missão/Trama `ACTIVE`
 *    relacionada (via Relacionamentos) a uma entidade arquivada (`archived`)
 *    ou com `canonStatus` `OBSOLETE`/`ARCHIVED`.
 */

export interface EntityRefLite {
  type: RelatableEntityType;
  id: string;
  name: string;
  href: string;
}

const OUTDATED_CANON_STATUSES: CanonStatus[] = ["OBSOLETE", "ARCHIVED"];

export interface CanonStatusConflictRow {
  relation: { id: string; type: string; description: string | null };
  canonEntity: EntityRefLite & { canonStatus: CanonStatus };
  outdatedEntity: EntityRefLite & { canonStatus: CanonStatus };
}

/**
 * Relacionamentos entre uma entidade `CANON` e outra `OBSOLETE`/`ARCHIVED` —
 * só considera pares onde AMBOS os lados têm `canonStatus` (os 7 tipos da
 * seção 12.2); uma relação envolvendo Missão/Trama/Consequência/Evento/
 * Mistério (que não têm esse eixo) nunca entra aqui, ver
 * `findActiveContentReferencingOutdated` para esses casos.
 */
export async function findCanonStatusConflicts(campaignId: string): Promise<CanonStatusConflictRow[]> {
  const rows = await loadAllRelationships(campaignId);
  const idsByType = groupIdsByType(rows);
  const [resolved, canonStatuses] = await Promise.all([
    resolveAllEndpoints(campaignId, idsByType),
    resolveCanonStatuses(campaignId, idsByType),
  ]);

  const results: CanonStatusConflictRow[] = [];
  for (const row of rows) {
    const sourceKey = entityKey(row.sourceType, row.sourceId);
    const targetKey = entityKey(row.targetType, row.targetId);
    const sourceStatus = canonStatuses.get(sourceKey);
    const targetStatus = canonStatuses.get(targetKey);
    if (!sourceStatus || !targetStatus) continue;

    let canonKey: string | null = null;
    let outdatedKey: string | null = null;
    if (sourceStatus === "CANON" && OUTDATED_CANON_STATUSES.includes(targetStatus)) {
      canonKey = sourceKey;
      outdatedKey = targetKey;
    } else if (targetStatus === "CANON" && OUTDATED_CANON_STATUSES.includes(sourceStatus)) {
      canonKey = targetKey;
      outdatedKey = sourceKey;
    }
    if (!canonKey || !outdatedKey) continue;

    const canonRef = resolved.get(canonKey);
    const outdatedRef = resolved.get(outdatedKey);
    if (!canonRef || !outdatedRef) continue;

    results.push({
      relation: { id: row.id, type: row.type, description: row.description },
      canonEntity: {
        type: canonRef.type,
        id: canonRef.id,
        name: canonRef.name,
        href: getEntityHref(campaignId, canonRef.type, canonRef.id),
        canonStatus: canonStatuses.get(canonKey)!,
      },
      outdatedEntity: {
        type: outdatedRef.type,
        id: outdatedRef.id,
        name: outdatedRef.name,
        href: getEntityHref(campaignId, outdatedRef.type, outdatedRef.id),
        canonStatus: canonStatuses.get(outdatedKey)!,
      },
    });
  }

  return results;
}

export interface ActiveReferencingOutdatedRow {
  relation: { id: string; type: string; description: string | null };
  activeEntity: EntityRefLite & { status: QuestStatus | PlotThreadStatus };
  outdatedEntity: EntityRefLite & { archived: boolean; canonStatus: CanonStatus | null };
}

/**
 * Missões/Tramas `ACTIVE` (não arquivadas) relacionadas a uma entidade
 * arquivada (`archived: true`, o eixo organizacional) ou com `canonStatus`
 * `OBSOLETE`/`ARCHIVED` (o eixo narrativo, quando a entidade tem esse campo)
 * — uma trama em andamento que depende de algo que já saiu de cena é o tipo
 * de inconsistência que o mestre normalmente só percebe no meio da mesa.
 */
export async function findActiveContentReferencingOutdated(campaignId: string): Promise<ActiveReferencingOutdatedRow[]> {
  const [quests, plotThreads, rows] = await Promise.all([
    db.quest.findMany({ where: { campaignId, archived: false, status: "ACTIVE" }, select: { id: true, title: true, status: true } }),
    db.plotThread.findMany({
      where: { campaignId, archived: false, status: "ACTIVE" },
      select: { id: true, title: true, status: true },
    }),
    loadAllRelationships(campaignId),
  ]);

  const activeById = new Map<string, { type: "QUEST" | "PLOT_THREAD"; id: string; title: string; status: QuestStatus | PlotThreadStatus }>();
  for (const q of quests) activeById.set(entityKey("QUEST", q.id), { type: "QUEST", id: q.id, title: q.title, status: q.status });
  for (const p of plotThreads) {
    activeById.set(entityKey("PLOT_THREAD", p.id), { type: "PLOT_THREAD", id: p.id, title: p.title, status: p.status });
  }
  if (activeById.size === 0) return [];

  const idsByType = groupIdsByType(rows);
  const [resolved, canonStatuses] = await Promise.all([
    resolveAllEndpoints(campaignId, idsByType),
    resolveCanonStatuses(campaignId, idsByType),
  ]);

  const results: ActiveReferencingOutdatedRow[] = [];
  for (const row of rows) {
    const sourceKey = entityKey(row.sourceType, row.sourceId);
    const targetKey = entityKey(row.targetType, row.targetId);
    const sourceActive = activeById.get(sourceKey);
    const targetActive = activeById.get(targetKey);

    let activeKey: string | null = null;
    let otherKey: string | null = null;
    if (sourceActive && !targetActive) {
      activeKey = sourceKey;
      otherKey = targetKey;
    } else if (targetActive && !sourceActive) {
      activeKey = targetKey;
      otherKey = sourceKey;
    } else {
      continue; // nenhum lado é Missão/Trama ativa, ou os dois são — fora do escopo deste check
    }

    const otherRef = resolved.get(otherKey);
    if (!otherRef) continue;

    const otherCanonStatus = canonStatuses.get(otherKey) ?? null;
    const isOutdatedCanon = otherCanonStatus !== null && OUTDATED_CANON_STATUSES.includes(otherCanonStatus);
    if (!otherRef.archived && !isOutdatedCanon) continue;

    const activeInfo = activeById.get(activeKey)!;
    results.push({
      relation: { id: row.id, type: row.type, description: row.description },
      activeEntity: {
        type: activeInfo.type,
        id: activeInfo.id,
        name: activeInfo.title,
        href: getEntityHref(campaignId, activeInfo.type, activeInfo.id),
        status: activeInfo.status,
      },
      outdatedEntity: {
        type: otherRef.type,
        id: otherRef.id,
        name: otherRef.name,
        href: getEntityHref(campaignId, otherRef.type, otherRef.id),
        archived: otherRef.archived,
        canonStatus: otherCanonStatus,
      },
    });
  }

  return results;
}
