import "server-only";

import { db } from "@/lib/db";
import type { CanonStatus, RelatableEntityType } from "@/generated/prisma/client";
import { getContentEntityHref, type ContentEntityType, ARCHIVABLE_ENTITY_TYPES } from "@/modules/intelligence/content-types";
import { getEntityHref } from "@/modules/creation/relationships/config";

/**
 * Fase 7 — Campaign Health (ver ARCHITECTURE.md, seção 18.3). Heurísticas
 * simples e explicáveis, NUNCA uma pontuação numérica de "saúde" — todo
 * limiar usado aqui é literal e documentado, não uma fórmula escondida.
 */
export const STALE_DAYS = 30;

function staleCutoff(): Date {
  return new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);
}

export interface StaleContentRow {
  type: ContentEntityType;
  id: string;
  title: string;
  href: string;
  updatedAt: Date;
}

/** Missões `ACTIVE` sem nenhuma edição há mais de `STALE_DAYS` dias — provável sinal de "esquecida", não abandonada de propósito. */
export async function listStaleActiveQuests(campaignId: string): Promise<StaleContentRow[]> {
  const rows = await db.quest.findMany({
    where: { campaignId, archived: false, status: "ACTIVE", updatedAt: { lt: staleCutoff() } },
    orderBy: { updatedAt: "asc" },
    select: { id: true, title: true, updatedAt: true },
  });
  return rows.map((r) => ({ type: "QUEST", id: r.id, title: r.title, href: getContentEntityHref(campaignId, "QUEST", r.id), updatedAt: r.updatedAt }));
}

/** Tramas `DORMANT` — por definição já são "paradas"; listadas todas, sem limiar de tempo (o status já diz isso). */
export async function listDormantPlotThreads(campaignId: string): Promise<StaleContentRow[]> {
  const rows = await db.plotThread.findMany({
    where: { campaignId, archived: false, status: "DORMANT" },
    orderBy: { updatedAt: "asc" },
    select: { id: true, title: true, updatedAt: true },
  });
  return rows.map((r) => ({ type: "PLOT_THREAD", id: r.id, title: r.title, href: getContentEntityHref(campaignId, "PLOT_THREAD", r.id), updatedAt: r.updatedAt }));
}

/** Mistérios `OPEN` sem atualização há mais de `STALE_DAYS` dias — investigações que a mesa pode ter esquecido. */
export async function listStaleOpenMysteries(campaignId: string): Promise<StaleContentRow[]> {
  const rows = await db.mystery.findMany({
    where: { campaignId, archived: false, status: "OPEN", updatedAt: { lt: staleCutoff() } },
    orderBy: { updatedAt: "asc" },
    select: { id: true, title: true, updatedAt: true },
  });
  return rows.map((r) => ({ type: "MYSTERY", id: r.id, title: r.title, href: getContentEntityHref(campaignId, "MYSTERY", r.id), updatedAt: r.updatedAt }));
}

/** Conteúdo com `canonStatus` DRAFT/PROPOSED parado há mais de `STALE_DAYS` dias — os 7 tipos com esse eixo (seção 12.2). */
export async function listStuckInDraft(campaignId: string): Promise<StaleContentRow[]> {
  const draftLikeStatuses: CanonStatus[] = ["DRAFT", "PROPOSED"];
  const where = {
    campaignId,
    archived: false,
    canonStatus: { in: draftLikeStatuses },
    updatedAt: { lt: staleCutoff() },
  };
  const select = { id: true, name: true, updatedAt: true } as const;
  const selectTitle = { id: true, title: true, updatedAt: true } as const;

  const [npcs, locations, factions, lorePages, monsters, items, powers] = await Promise.all([
    db.npc.findMany({ where, select }),
    db.location.findMany({ where, select }),
    db.faction.findMany({ where, select }),
    db.lorePage.findMany({ where, select: selectTitle }),
    db.monster.findMany({ where, select }),
    db.item.findMany({ where, select }),
    db.power.findMany({ where, select }),
  ]);

  const rows: StaleContentRow[] = [
    ...npcs.map((r) => ({ type: "NPC" as const, id: r.id, title: r.name, href: getContentEntityHref(campaignId, "NPC", r.id), updatedAt: r.updatedAt })),
    ...locations.map((r) => ({ type: "LOCATION" as const, id: r.id, title: r.name, href: getContentEntityHref(campaignId, "LOCATION", r.id), updatedAt: r.updatedAt })),
    ...factions.map((r) => ({ type: "FACTION" as const, id: r.id, title: r.name, href: getContentEntityHref(campaignId, "FACTION", r.id), updatedAt: r.updatedAt })),
    ...lorePages.map((r) => ({ type: "LORE_PAGE" as const, id: r.id, title: r.title, href: getContentEntityHref(campaignId, "LORE_PAGE", r.id), updatedAt: r.updatedAt })),
    ...monsters.map((r) => ({ type: "MONSTER" as const, id: r.id, title: r.name, href: getContentEntityHref(campaignId, "MONSTER", r.id), updatedAt: r.updatedAt })),
    ...items.map((r) => ({ type: "ITEM" as const, id: r.id, title: r.name, href: getContentEntityHref(campaignId, "ITEM", r.id), updatedAt: r.updatedAt })),
    ...powers.map((r) => ({ type: "POWER" as const, id: r.id, title: r.name, href: getContentEntityHref(campaignId, "POWER", r.id), updatedAt: r.updatedAt })),
  ];

  return rows.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
}

/**
 * Conteúdo "órfão": nenhum Relacionamento aponta de/para ele (ver
 * ARCHITECTURE.md, seção 18.3) — os 12 tipos de `RelatableEntityType`, não
 * arquivados. Uma única query em `Relationship` para todo o campo, não uma
 * por entidade (evitaria N+1 com dezenas/centenas de linhas).
 */
export async function listOrphanContent(campaignId: string): Promise<StaleContentRow[]> {
  const select = { id: true, name: true, updatedAt: true } as const;
  const selectTitle = { id: true, title: true, updatedAt: true } as const;
  const where = { campaignId, archived: false };

  const [
    npcs,
    locations,
    factions,
    lorePages,
    quests,
    plotThreads,
    consequences,
    timelineEvents,
    mysteries,
    monsters,
    items,
    powers,
    relationships,
  ] = await Promise.all([
    db.npc.findMany({ where, select }),
    db.location.findMany({ where, select }),
    db.faction.findMany({ where, select }),
    db.lorePage.findMany({ where, select: selectTitle }),
    db.quest.findMany({ where, select: selectTitle }),
    db.plotThread.findMany({ where, select: selectTitle }),
    db.consequence.findMany({ where, select: selectTitle }),
    db.timelineEvent.findMany({ where, select: selectTitle }),
    db.mystery.findMany({ where, select: selectTitle }),
    db.monster.findMany({ where, select }),
    db.item.findMany({ where, select }),
    db.power.findMany({ where, select }),
    db.relationship.findMany({ where: { campaignId }, select: { sourceType: true, sourceId: true, targetType: true, targetId: true } }),
  ]);

  const involved = new Set<string>();
  for (const rel of relationships) {
    involved.add(`${rel.sourceType}:${rel.sourceId}`);
    involved.add(`${rel.targetType}:${rel.targetId}`);
  }

  function buildRows<T extends { id: string; updatedAt: Date }>(
    type: RelatableEntityType,
    rows: T[],
    titleOf: (row: T) => string,
  ): StaleContentRow[] {
    return rows
      .filter((row) => !involved.has(`${type}:${row.id}`))
      .map((row) => ({ type, id: row.id, title: titleOf(row), href: getEntityHref(campaignId, type, row.id), updatedAt: row.updatedAt }));
  }

  const result: StaleContentRow[] = [
    ...buildRows("NPC", npcs, (r) => r.name),
    ...buildRows("LOCATION", locations, (r) => r.name),
    ...buildRows("FACTION", factions, (r) => r.name),
    ...buildRows("LORE_PAGE", lorePages, (r) => r.title),
    ...buildRows("QUEST", quests, (r) => r.title),
    ...buildRows("PLOT_THREAD", plotThreads, (r) => r.title),
    ...buildRows("CONSEQUENCE", consequences, (r) => r.title),
    ...buildRows("TIMELINE_EVENT", timelineEvents, (r) => r.title),
    ...buildRows("MYSTERY", mysteries, (r) => r.title),
    ...buildRows("MONSTER", monsters, (r) => r.name),
    ...buildRows("ITEM", items, (r) => r.name),
    ...buildRows("POWER", powers, (r) => r.name),
  ];

  return result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export interface ArchiveRatioRow {
  type: ContentEntityType;
  active: number;
  archived: number;
}

/** Proporção arquivado/ativo por tipo — os 17 tipos com campo `archived` (ver `ARCHIVABLE_ENTITY_TYPES`). */
export async function getArchiveRatioBreakdown(campaignId: string): Promise<ArchiveRatioRow[]> {
  const counts = await Promise.all([
    db.npc.count({ where: { campaignId, archived: false } }),
    db.npc.count({ where: { campaignId, archived: true } }),
    db.location.count({ where: { campaignId, archived: false } }),
    db.location.count({ where: { campaignId, archived: true } }),
    db.faction.count({ where: { campaignId, archived: false } }),
    db.faction.count({ where: { campaignId, archived: true } }),
    db.lorePage.count({ where: { campaignId, archived: false } }),
    db.lorePage.count({ where: { campaignId, archived: true } }),
    db.idea.count({ where: { campaignId, archived: false } }),
    db.idea.count({ where: { campaignId, archived: true } }),
    db.quest.count({ where: { campaignId, archived: false } }),
    db.quest.count({ where: { campaignId, archived: true } }),
    db.plotThread.count({ where: { campaignId, archived: false } }),
    db.plotThread.count({ where: { campaignId, archived: true } }),
    db.consequence.count({ where: { campaignId, archived: false } }),
    db.consequence.count({ where: { campaignId, archived: true } }),
    db.timelineEvent.count({ where: { campaignId, archived: false } }),
    db.timelineEvent.count({ where: { campaignId, archived: true } }),
    db.narrativeClock.count({ where: { campaignId, archived: false } }),
    db.narrativeClock.count({ where: { campaignId, archived: true } }),
    db.mystery.count({ where: { campaignId, archived: false } }),
    db.mystery.count({ where: { campaignId, archived: true } }),
    db.monster.count({ where: { campaignId, archived: false } }),
    db.monster.count({ where: { campaignId, archived: true } }),
    db.item.count({ where: { campaignId, archived: false } }),
    db.item.count({ where: { campaignId, archived: true } }),
    db.power.count({ where: { campaignId, archived: false } }),
    db.power.count({ where: { campaignId, archived: true } }),
    db.rollTable.count({ where: { campaignId, kind: "GENERIC", archived: false } }),
    db.rollTable.count({ where: { campaignId, kind: "GENERIC", archived: true } }),
    db.rollTable.count({ where: { campaignId, kind: "LOOT", archived: false } }),
    db.rollTable.count({ where: { campaignId, kind: "LOOT", archived: true } }),
    db.sessionPlan.count({ where: { campaignId, archived: false } }),
    db.sessionPlan.count({ where: { campaignId, archived: true } }),
  ]);

  const types: ContentEntityType[] = [
    "NPC",
    "LOCATION",
    "FACTION",
    "LORE_PAGE",
    "IDEA",
    "QUEST",
    "PLOT_THREAD",
    "CONSEQUENCE",
    "TIMELINE_EVENT",
    "NARRATIVE_CLOCK",
    "MYSTERY",
    "MONSTER",
    "ITEM",
    "POWER",
    "ROLL_TABLE_GENERIC",
    "ROLL_TABLE_LOOT",
    "SESSION_PLAN",
  ];

  // `types` acompanha `ARCHIVABLE_ENTITY_TYPES` 1:1 — checagem em tempo de execução, não só de tipo.
  if (types.length !== ARCHIVABLE_ENTITY_TYPES.length) {
    throw new Error("getArchiveRatioBreakdown: lista de tipos desalinhada com ARCHIVABLE_ENTITY_TYPES.");
  }

  return types.map((type, index) => ({ type, active: counts[index * 2], archived: counts[index * 2 + 1] }));
}
