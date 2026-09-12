import "server-only";

import { db } from "@/lib/db";
import type { CanonStatus } from "@/generated/prisma/client";
import { getContentEntityHref, type ContentEntityType, CANON_STATUS_ENTITY_TYPES } from "@/modules/intelligence/content-types";

/**
 * Fase 7 — Campaign Brain avançado (ver ARCHITECTURE.md, seção 18.1).
 *
 * Estende o "Últimas alterações" do Dashboard (Fase 1, `core/dashboard/queries.ts`,
 * 8 tipos) para os 17 tipos de conteúdo que existem hoje na campanha, incluindo
 * tudo que chegou nas Fases 5 e 6 (Timeline, Relógios, Mistérios, Monstros,
 * Itens, Poderes, Tabelas, Sessões) — o Dashboard continua com sua versão mais
 * enxuta (é a tela do dia a dia); este painel é o "raio-x temporal" completo.
 */
export interface UnifiedActivityItem {
  type: ContentEntityType;
  id: string;
  title: string;
  href: string;
  updatedAt: Date;
}

async function fetchAllContent(campaignId: string, limitPerType: number) {
  const where = { campaignId, archived: false };
  const orderBy = { updatedAt: "desc" as const };
  const take = limitPerType;

  const [
    npcs,
    locations,
    factions,
    lorePages,
    ideas,
    quests,
    plotThreads,
    consequences,
    timelineEvents,
    narrativeClocks,
    mysteries,
    monsters,
    items,
    powers,
    rollTables,
    sessionPlans,
  ] = await Promise.all([
    db.npc.findMany({ where, orderBy, take, select: { id: true, name: true, updatedAt: true } }),
    db.location.findMany({ where, orderBy, take, select: { id: true, name: true, updatedAt: true } }),
    db.faction.findMany({ where, orderBy, take, select: { id: true, name: true, updatedAt: true } }),
    db.lorePage.findMany({ where, orderBy, take, select: { id: true, title: true, updatedAt: true } }),
    db.idea.findMany({ where, orderBy, take, select: { id: true, title: true, updatedAt: true } }),
    db.quest.findMany({ where, orderBy, take, select: { id: true, title: true, updatedAt: true } }),
    db.plotThread.findMany({ where, orderBy, take, select: { id: true, title: true, updatedAt: true } }),
    db.consequence.findMany({ where, orderBy, take, select: { id: true, title: true, updatedAt: true } }),
    db.timelineEvent.findMany({ where, orderBy, take, select: { id: true, title: true, updatedAt: true } }),
    db.narrativeClock.findMany({ where, orderBy, take, select: { id: true, title: true, updatedAt: true } }),
    db.mystery.findMany({ where, orderBy, take, select: { id: true, title: true, updatedAt: true } }),
    db.monster.findMany({ where, orderBy, take, select: { id: true, name: true, updatedAt: true } }),
    db.item.findMany({ where, orderBy, take, select: { id: true, name: true, updatedAt: true } }),
    db.power.findMany({ where, orderBy, take, select: { id: true, name: true, updatedAt: true } }),
    db.rollTable.findMany({ where, orderBy, take, select: { id: true, name: true, updatedAt: true, kind: true } }),
    db.sessionPlan.findMany({ where, orderBy, take, select: { id: true, title: true, updatedAt: true } }),
  ]);

  return {
    npcs,
    locations,
    factions,
    lorePages,
    ideas,
    quests,
    plotThreads,
    consequences,
    timelineEvents,
    narrativeClocks,
    mysteries,
    monsters,
    items,
    powers,
    rollTables,
    sessionPlans,
  };
}

/** Feed único de "o que mudou" em toda a campanha, ordenado por `updatedAt` — sem IA, só um merge+sort de 16 queries. */
export async function listUnifiedRecentActivity(campaignId: string, limit = 20): Promise<UnifiedActivityItem[]> {
  const rows = await fetchAllContent(campaignId, limit);

  const items: UnifiedActivityItem[] = [
    ...rows.npcs.map((r) => ({ type: "NPC" as const, id: r.id, title: r.name, href: getContentEntityHref(campaignId, "NPC", r.id), updatedAt: r.updatedAt })),
    ...rows.locations.map((r) => ({ type: "LOCATION" as const, id: r.id, title: r.name, href: getContentEntityHref(campaignId, "LOCATION", r.id), updatedAt: r.updatedAt })),
    ...rows.factions.map((r) => ({ type: "FACTION" as const, id: r.id, title: r.name, href: getContentEntityHref(campaignId, "FACTION", r.id), updatedAt: r.updatedAt })),
    ...rows.lorePages.map((r) => ({ type: "LORE_PAGE" as const, id: r.id, title: r.title, href: getContentEntityHref(campaignId, "LORE_PAGE", r.id), updatedAt: r.updatedAt })),
    ...rows.ideas.map((r) => ({ type: "IDEA" as const, id: r.id, title: r.title, href: getContentEntityHref(campaignId, "IDEA", r.id), updatedAt: r.updatedAt })),
    ...rows.quests.map((r) => ({ type: "QUEST" as const, id: r.id, title: r.title, href: getContentEntityHref(campaignId, "QUEST", r.id), updatedAt: r.updatedAt })),
    ...rows.plotThreads.map((r) => ({ type: "PLOT_THREAD" as const, id: r.id, title: r.title, href: getContentEntityHref(campaignId, "PLOT_THREAD", r.id), updatedAt: r.updatedAt })),
    ...rows.consequences.map((r) => ({ type: "CONSEQUENCE" as const, id: r.id, title: r.title, href: getContentEntityHref(campaignId, "CONSEQUENCE", r.id), updatedAt: r.updatedAt })),
    ...rows.timelineEvents.map((r) => ({ type: "TIMELINE_EVENT" as const, id: r.id, title: r.title, href: getContentEntityHref(campaignId, "TIMELINE_EVENT", r.id), updatedAt: r.updatedAt })),
    ...rows.narrativeClocks.map((r) => ({ type: "NARRATIVE_CLOCK" as const, id: r.id, title: r.title, href: getContentEntityHref(campaignId, "NARRATIVE_CLOCK", r.id), updatedAt: r.updatedAt })),
    ...rows.mysteries.map((r) => ({ type: "MYSTERY" as const, id: r.id, title: r.title, href: getContentEntityHref(campaignId, "MYSTERY", r.id), updatedAt: r.updatedAt })),
    ...rows.monsters.map((r) => ({ type: "MONSTER" as const, id: r.id, title: r.name, href: getContentEntityHref(campaignId, "MONSTER", r.id), updatedAt: r.updatedAt })),
    ...rows.items.map((r) => ({ type: "ITEM" as const, id: r.id, title: r.name, href: getContentEntityHref(campaignId, "ITEM", r.id), updatedAt: r.updatedAt })),
    ...rows.powers.map((r) => ({ type: "POWER" as const, id: r.id, title: r.name, href: getContentEntityHref(campaignId, "POWER", r.id), updatedAt: r.updatedAt })),
    ...rows.rollTables.map((r) => {
      const type: "ROLL_TABLE_LOOT" | "ROLL_TABLE_GENERIC" = r.kind === "LOOT" ? "ROLL_TABLE_LOOT" : "ROLL_TABLE_GENERIC";
      return { type, id: r.id, title: r.name, href: getContentEntityHref(campaignId, type, r.id), updatedAt: r.updatedAt };
    }),
    ...rows.sessionPlans.map((r) => ({ type: "SESSION_PLAN" as const, id: r.id, title: r.title, href: getContentEntityHref(campaignId, "SESSION_PLAN", r.id), updatedAt: r.updatedAt })),
  ];

  return items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, limit);
}

export interface CanonStatusBreakdownRow {
  type: (typeof CANON_STATUS_ENTITY_TYPES)[number];
  counts: Record<CanonStatus, number>;
  total: number;
}

/**
 * Distribuição de `canonStatus` por tipo — só os 7 tipos que têm esse campo
 * (ver ARCHITECTURE.md, seção 12.2). Um `groupBy` por tipo em vez de carregar
 * as linhas inteiras: só queremos a contagem, nunca os dados completos.
 */
export async function getCanonStatusBreakdown(campaignId: string): Promise<CanonStatusBreakdownRow[]> {
  const emptyCounts = (): Record<CanonStatus, number> => ({
    DRAFT: 0,
    PROPOSED: 0,
    APPROVED: 0,
    CANON: 0,
    OBSOLETE: 0,
    ARCHIVED: 0,
  });

  const [npc, location, faction, lorePage, monster, item, power] = await Promise.all([
    db.npc.groupBy({ by: ["canonStatus"], where: { campaignId }, _count: { _all: true } }),
    db.location.groupBy({ by: ["canonStatus"], where: { campaignId }, _count: { _all: true } }),
    db.faction.groupBy({ by: ["canonStatus"], where: { campaignId }, _count: { _all: true } }),
    db.lorePage.groupBy({ by: ["canonStatus"], where: { campaignId }, _count: { _all: true } }),
    db.monster.groupBy({ by: ["canonStatus"], where: { campaignId }, _count: { _all: true } }),
    db.item.groupBy({ by: ["canonStatus"], where: { campaignId }, _count: { _all: true } }),
    db.power.groupBy({ by: ["canonStatus"], where: { campaignId }, _count: { _all: true } }),
  ]);

  const grouped: Record<(typeof CANON_STATUS_ENTITY_TYPES)[number], typeof npc> = {
    NPC: npc,
    LOCATION: location,
    FACTION: faction,
    LORE_PAGE: lorePage,
    MONSTER: monster,
    ITEM: item,
    POWER: power,
  };

  return CANON_STATUS_ENTITY_TYPES.map((type) => {
    const counts = emptyCounts();
    let total = 0;
    for (const row of grouped[type]) {
      counts[row.canonStatus] = row._count._all;
      total += row._count._all;
    }
    return { type, counts, total };
  });
}
