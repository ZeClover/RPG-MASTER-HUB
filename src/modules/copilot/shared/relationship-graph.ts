import "server-only";

import { db } from "@/lib/db";
import type { CanonStatus, RelatableEntityType } from "@/generated/prisma/client";
import { resolveEntityRefs, type EntityRef } from "@/modules/creation/relationships/queries";

/**
 * Carregador compartilhado por Lore Guardian e Canon Checker (Fase 8, ver
 * ARCHITECTURE.md, seção 19): ambos precisam da mesma coisa — todas as linhas
 * de `Relationship` da campanha, com os dois lados resolvidos (nome/arquivado)
 * contra a tabela concreta certa. Reaproveita `resolveEntityRefs`
 * (`creation/relationships/queries.ts`, Fase 1) em vez de duplicar a
 * resolução polimórfica em lote por tipo.
 */
export interface RelationshipRow {
  id: string;
  sourceType: RelatableEntityType;
  sourceId: string;
  targetType: RelatableEntityType;
  targetId: string;
  type: string;
  description: string | null;
}

export function loadAllRelationships(campaignId: string): Promise<RelationshipRow[]> {
  return db.relationship.findMany({
    where: { campaignId },
    select: {
      id: true,
      sourceType: true,
      sourceId: true,
      targetType: true,
      targetId: true,
      type: true,
      description: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export function groupIdsByType(rows: RelationshipRow[]): Map<RelatableEntityType, Set<string>> {
  const idsByType = new Map<RelatableEntityType, Set<string>>();
  for (const row of rows) {
    if (!idsByType.has(row.sourceType)) idsByType.set(row.sourceType, new Set());
    idsByType.get(row.sourceType)!.add(row.sourceId);
    if (!idsByType.has(row.targetType)) idsByType.set(row.targetType, new Set());
    idsByType.get(row.targetType)!.add(row.targetId);
  }
  return idsByType;
}

export function entityKey(type: RelatableEntityType, id: string): string {
  return `${type}:${id}`;
}

/** Uma query por tipo envolvido (no máximo 12), nunca uma por relação — mesmo cuidado de N+1 da Fase 1/7. */
export async function resolveAllEndpoints(
  campaignId: string,
  idsByType: Map<RelatableEntityType, Set<string>>,
): Promise<Map<string, EntityRef>> {
  const merged = new Map<string, EntityRef>();
  await Promise.all(
    [...idsByType.entries()].map(async ([type, ids]) => {
      const resolved = await resolveEntityRefs(campaignId, type, [...ids]);
      for (const [id, ref] of resolved) merged.set(entityKey(type, id), ref);
    }),
  );
  return merged;
}

/**
 * Os 7 tipos com `canonStatus` (seção 12.2) — o único subconjunto de
 * `RelatableEntityType` que o Canon Checker precisa para o eixo canônico
 * (Quest/PlotThread/Consequence/TimelineEvent/Mystery não têm esse campo).
 */
const CANON_STATUS_TYPES: readonly RelatableEntityType[] = [
  "NPC",
  "LOCATION",
  "FACTION",
  "LORE_PAGE",
  "MONSTER",
  "ITEM",
  "POWER",
];

/**
 * `canonStatus` das entidades envolvidas, resolvido em lote por tipo (mesmo
 * padrão de `resolveAllEndpoints`) — só para o Canon Checker, que precisa do
 * eixo narrativo além de nome/`archived` (que `EntityRef` já cobre). Um
 * `switch` porque `canonStatus` não existe em todo modelo (ao contrário de
 * `resolveEntityRefs`, que resolve os 12 tipos por igual).
 */
export async function resolveCanonStatuses(
  campaignId: string,
  idsByType: Map<RelatableEntityType, Set<string>>,
): Promise<Map<string, CanonStatus>> {
  const merged = new Map<string, CanonStatus>();

  await Promise.all(
    [...idsByType.entries()]
      .filter(([type]) => CANON_STATUS_TYPES.includes(type))
      .map(async ([type, idSet]) => {
        const ids = [...idSet];
        const select = { id: true, canonStatus: true } as const;
        let rows: { id: string; canonStatus: CanonStatus }[];

        switch (type) {
          case "NPC":
            rows = await db.npc.findMany({ where: { campaignId, id: { in: ids } }, select });
            break;
          case "LOCATION":
            rows = await db.location.findMany({ where: { campaignId, id: { in: ids } }, select });
            break;
          case "FACTION":
            rows = await db.faction.findMany({ where: { campaignId, id: { in: ids } }, select });
            break;
          case "LORE_PAGE":
            rows = await db.lorePage.findMany({ where: { campaignId, id: { in: ids } }, select });
            break;
          case "MONSTER":
            rows = await db.monster.findMany({ where: { campaignId, id: { in: ids } }, select });
            break;
          case "ITEM":
            rows = await db.item.findMany({ where: { campaignId, id: { in: ids } }, select });
            break;
          case "POWER":
            rows = await db.power.findMany({ where: { campaignId, id: { in: ids } }, select });
            break;
          default:
            rows = [];
        }

        for (const row of rows) merged.set(entityKey(type, row.id), row.canonStatus);
      }),
  );

  return merged;
}
