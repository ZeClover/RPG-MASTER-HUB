import "server-only";

import { db } from "@/lib/db";
import type { RelatableEntityType } from "@/generated/prisma/client";
import { getEntityHref } from "@/modules/creation/relationships/config";
import {
  loadAllRelationships,
  groupIdsByType,
  resolveAllEndpoints,
  entityKey,
} from "@/modules/copilot/shared/relationship-graph";
import {
  matchNames,
  normalizeForComparison,
  findOppositeKeywordMatch,
  type NameMatchKind,
} from "@/modules/copilot/lore-guardian/heuristics";

/**
 * Lore Guardian (Fase 8, ver ARCHITECTURE.md, seção 19) — verificador
 * heurístico de consistência NARRATIVA (duplicação/contradição), sem LLM.
 * Deliberadamente não cobre "conteúdo parado"/atividade — isso já é o
 * Campaign Health (Fase 7, seção 18.3); sobrepor os dois seria ruído.
 */

interface NamedEntity {
  type: RelatableEntityType;
  id: string;
  name: string;
}

/** Os 12 tipos de `RelatableEntityType` — mesmo universo do Context Engine (seção 18.6), não o mais amplo `ContentEntityType`. */
async function loadAllEntityNames(campaignId: string): Promise<NamedEntity[]> {
  const where = { campaignId, archived: false };
  const selectName = { id: true, name: true } as const;
  const selectTitle = { id: true, title: true } as const;

  const [npcs, locations, factions, lorePages, quests, plotThreads, consequences, timelineEvents, mysteries, monsters, items, powers] =
    await Promise.all([
      db.npc.findMany({ where, select: selectName }),
      db.location.findMany({ where, select: selectName }),
      db.faction.findMany({ where, select: selectName }),
      db.lorePage.findMany({ where, select: selectTitle }),
      db.quest.findMany({ where, select: selectTitle }),
      db.plotThread.findMany({ where, select: selectTitle }),
      db.consequence.findMany({ where, select: selectTitle }),
      db.timelineEvent.findMany({ where, select: selectTitle }),
      db.mystery.findMany({ where, select: selectTitle }),
      db.monster.findMany({ where, select: selectName }),
      db.item.findMany({ where, select: selectName }),
      db.power.findMany({ where, select: selectName }),
    ]);

  return [
    ...npcs.map((r) => ({ type: "NPC" as const, id: r.id, name: r.name })),
    ...locations.map((r) => ({ type: "LOCATION" as const, id: r.id, name: r.name })),
    ...factions.map((r) => ({ type: "FACTION" as const, id: r.id, name: r.name })),
    ...lorePages.map((r) => ({ type: "LORE_PAGE" as const, id: r.id, name: r.title })),
    ...quests.map((r) => ({ type: "QUEST" as const, id: r.id, name: r.title })),
    ...plotThreads.map((r) => ({ type: "PLOT_THREAD" as const, id: r.id, name: r.title })),
    ...consequences.map((r) => ({ type: "CONSEQUENCE" as const, id: r.id, name: r.title })),
    ...timelineEvents.map((r) => ({ type: "TIMELINE_EVENT" as const, id: r.id, name: r.title })),
    ...mysteries.map((r) => ({ type: "MYSTERY" as const, id: r.id, name: r.title })),
    ...monsters.map((r) => ({ type: "MONSTER" as const, id: r.id, name: r.name })),
    ...items.map((r) => ({ type: "ITEM" as const, id: r.id, name: r.name })),
    ...powers.map((r) => ({ type: "POWER" as const, id: r.id, name: r.name })),
  ];
}

export interface EntityRefLite {
  type: RelatableEntityType;
  id: string;
  name: string;
  href: string;
}

export interface DuplicateNameRow {
  kind: NameMatchKind;
  a: EntityRefLite;
  b: EntityRefLite;
}

/**
 * Nomes duplicados ou muito parecidos entre entidades da MESMA campanha,
 * cruzando os 12 tipos relacionáveis entre si (um Local e um NPC com o mesmo
 * nome confundem tanto quanto dois NPCs) — comparação O(n²) simples, aceitável
 * porque roda sob demanda (não é uma query de listagem cotidiana) e o volume
 * real de entidades por campanha (dezenas a poucas centenas) mantém isso
 * rápido o bastante sem precisar de índice/estrutura especial.
 */
export async function findDuplicateOrSimilarNames(campaignId: string): Promise<DuplicateNameRow[]> {
  const entities = await loadAllEntityNames(campaignId);
  const normalized = entities.map((entity) => ({ ...entity, normalized: normalizeForComparison(entity.name) }));

  const results: DuplicateNameRow[] = [];
  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      const kind = matchNames(normalized[i].normalized, normalized[j].normalized);
      if (!kind) continue;

      const toRef = (entity: NamedEntity): EntityRefLite => ({
        type: entity.type,
        id: entity.id,
        name: entity.name,
        href: getEntityHref(campaignId, entity.type, entity.id),
      });
      results.push({ kind, a: toRef(normalized[i]), b: toRef(normalized[j]) });
    }
  }

  // Exatos primeiro (mais provável de ser um erro de verdade), depois parecidos.
  return results.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "EXACT" ? -1 : 1));
}

export interface ContradictionRelation {
  id: string;
  type: string;
  description: string | null;
  source: EntityRefLite;
  target: EntityRefLite;
}

export interface ContradictionRow {
  relationA: ContradictionRelation;
  relationB: ContradictionRelation;
  matchedKeywords: [string, string];
}

/**
 * Relacionamentos potencialmente contraditórios entre o MESMO par de
 * entidades (ex.: "é aliado de" e "é inimigo de" registrados entre A e B ao
 * mesmo tempo) — agrupa todas as linhas de `Relationship` por par não-
 * ordenado e testa cada combinação de duas linhas do mesmo par contra
 * `OPPOSITE_KEYWORD_GROUPS`. Heurística de palavra-chave, não de significado:
 * duas relações genuinamente diferentes ("lidera" e "teme", por exemplo) nunca
 * disparam isso porque nenhum par de palavras-chave cobre essa combinação.
 */
export async function findContradictoryRelationships(campaignId: string): Promise<ContradictionRow[]> {
  const rows = await loadAllRelationships(campaignId);
  const idsByType = groupIdsByType(rows);
  const resolved = await resolveAllEndpoints(campaignId, idsByType);

  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const keyA = entityKey(row.sourceType, row.sourceId);
    const keyB = entityKey(row.targetType, row.targetId);
    const pairKey = [keyA, keyB].sort().join("|");
    if (!groups.has(pairKey)) groups.set(pairKey, []);
    groups.get(pairKey)!.push(row);
  }

  function toRelation(row: (typeof rows)[number]): ContradictionRelation | null {
    const source = resolved.get(entityKey(row.sourceType, row.sourceId));
    const target = resolved.get(entityKey(row.targetType, row.targetId));
    if (!source || !target) return null;
    return {
      id: row.id,
      type: row.type,
      description: row.description,
      source: { type: row.sourceType, id: row.sourceId, name: source.name, href: getEntityHref(campaignId, row.sourceType, row.sourceId) },
      target: { type: row.targetType, id: row.targetId, name: target.name, href: getEntityHref(campaignId, row.targetType, row.targetId) },
    };
  }

  const results: ContradictionRow[] = [];
  for (const groupRows of groups.values()) {
    if (groupRows.length < 2) continue;

    for (let i = 0; i < groupRows.length; i++) {
      for (let j = i + 1; j < groupRows.length; j++) {
        const matched = findOppositeKeywordMatch(groupRows[i].type, groupRows[j].type);
        if (!matched) continue;

        const relationA = toRelation(groupRows[i]);
        const relationB = toRelation(groupRows[j]);
        if (!relationA || !relationB) continue;

        results.push({ relationA, relationB, matchedKeywords: matched });
      }
    }
  }

  return results;
}
