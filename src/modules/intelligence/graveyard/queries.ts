import "server-only";

import { getContentEntityHref, type ContentEntityType } from "@/modules/intelligence/content-types";
import { listNpcs } from "@/modules/creation/npcs/queries";
import { listLocations } from "@/modules/creation/locations/queries";
import { listFactions } from "@/modules/creation/factions/queries";
import { listLorePages } from "@/modules/creation/lore/queries";
import { listIdeas } from "@/modules/creation/ideas/queries";
import { listQuests } from "@/modules/preparation/quests/queries";
import { listPlotThreads } from "@/modules/preparation/plot-threads/queries";
import { listConsequences } from "@/modules/preparation/consequences/queries";
import { listTimelineEvents } from "@/modules/worldbuilding/timeline/queries";
import { listNarrativeClocks } from "@/modules/worldbuilding/clocks/queries";
import { listMysteries } from "@/modules/worldbuilding/mysteries/queries";
import { listMonsters } from "@/modules/gametools/monsters/queries";
import { listItems } from "@/modules/gametools/items/queries";
import { listPowers } from "@/modules/gametools/powers/queries";
import { listRollTables } from "@/modules/gametools/roll-tables/queries";
import { listSessionPlans } from "@/modules/preparation/session-plans/queries";
import {
  QUEST_STATUS_LABELS,
  PLOT_THREAD_STATUS_LABELS,
  CONSEQUENCE_STATUS_LABELS,
  MYSTERY_STATUS_LABELS,
  SESSION_PLAN_STATUS_LABELS,
  IDEA_STATE_LABELS,
} from "@/components/wiki/status-config";

export interface GraveyardItem {
  type: ContentEntityType;
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
  updatedAt: Date;
}

/**
 * Fase 7 — Content Graveyard (ver ARCHITECTURE.md, seção 18.4). Agrega o que
 * já está `archived: true` em TODOS os 17 tipos de conteúdo num só lugar —
 * cada `list*` chamada aqui já existe desde a fase que criou aquele tipo,
 * só com `{ archived: true }` em vez do padrão `false`. Nenhuma query nova
 * de leitura por tipo, só a orquestração + normalização.
 *
 * Fase 9: os `list*` de entidades com `visibility` agora exigem um papel para
 * decidir o filtro (ver `visibilityWhereForRole`). O literal `"CO_GM"` aqui
 * (em vez de receber o papel de quem chamou) é deliberado — o Graveyard é
 * ferramenta de limpeza do mestre e a própria página já exige CO_GM para
 * entrar (seção 21.5); ver tudo arquivado, independente de `visibility`, é o
 * comportamento certo aqui, não um vazamento.
 */
export async function listArchivedContent(campaignId: string): Promise<GraveyardItem[]> {
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
    rollTablesGeneric,
    rollTablesLoot,
    sessionPlans,
  ] = await Promise.all([
    listNpcs(campaignId, { archived: true }, "CO_GM"),
    listLocations(campaignId, { archived: true }, "CO_GM"),
    listFactions(campaignId, { archived: true }, "CO_GM"),
    listLorePages(campaignId, { archived: true }, "CO_GM"),
    listIdeas(campaignId, { archived: true }),
    listQuests(campaignId, { archived: true }, "CO_GM"),
    listPlotThreads(campaignId, { archived: true }, "CO_GM"),
    listConsequences(campaignId, { archived: true }, "CO_GM"),
    listTimelineEvents(campaignId, { archived: true }, "CO_GM"),
    listNarrativeClocks(campaignId, { archived: true }),
    listMysteries(campaignId, { archived: true }, "CO_GM"),
    listMonsters(campaignId, { archived: true }, "CO_GM"),
    listItems(campaignId, { archived: true }, "CO_GM"),
    listPowers(campaignId, { archived: true }, "CO_GM"),
    listRollTables(campaignId, "GENERIC", { archived: true }),
    listRollTables(campaignId, "LOOT", { archived: true }),
    listSessionPlans(campaignId, { archived: true }),
  ]);

  const items_: GraveyardItem[] = [
    ...npcs.map((r) => ({ type: "NPC" as const, id: r.id, title: r.name, subtitle: r.species, href: getContentEntityHref(campaignId, "NPC", r.id), updatedAt: r.updatedAt })),
    ...locations.map((r) => ({ type: "LOCATION" as const, id: r.id, title: r.name, subtitle: r.locationType, href: getContentEntityHref(campaignId, "LOCATION", r.id), updatedAt: r.updatedAt })),
    ...factions.map((r) => ({ type: "FACTION" as const, id: r.id, title: r.name, subtitle: r.factionType, href: getContentEntityHref(campaignId, "FACTION", r.id), updatedAt: r.updatedAt })),
    ...lorePages.map((r) => ({ type: "LORE_PAGE" as const, id: r.id, title: r.title, subtitle: r.category, href: getContentEntityHref(campaignId, "LORE_PAGE", r.id), updatedAt: r.updatedAt })),
    ...ideas.map((r) => ({ type: "IDEA" as const, id: r.id, title: r.title, subtitle: IDEA_STATE_LABELS[r.state], href: getContentEntityHref(campaignId, "IDEA", r.id), updatedAt: r.updatedAt })),
    ...quests.map((r) => ({ type: "QUEST" as const, id: r.id, title: r.title, subtitle: QUEST_STATUS_LABELS[r.status], href: getContentEntityHref(campaignId, "QUEST", r.id), updatedAt: r.updatedAt })),
    ...plotThreads.map((r) => ({ type: "PLOT_THREAD" as const, id: r.id, title: r.title, subtitle: PLOT_THREAD_STATUS_LABELS[r.status], href: getContentEntityHref(campaignId, "PLOT_THREAD", r.id), updatedAt: r.updatedAt })),
    ...consequences.map((r) => ({ type: "CONSEQUENCE" as const, id: r.id, title: r.title, subtitle: CONSEQUENCE_STATUS_LABELS[r.status], href: getContentEntityHref(campaignId, "CONSEQUENCE", r.id), updatedAt: r.updatedAt })),
    ...timelineEvents.map((r) => ({ type: "TIMELINE_EVENT" as const, id: r.id, title: r.title, subtitle: r.narrativeDate, href: getContentEntityHref(campaignId, "TIMELINE_EVENT", r.id), updatedAt: r.updatedAt })),
    ...narrativeClocks.map((r) => ({ type: "NARRATIVE_CLOCK" as const, id: r.id, title: r.title, subtitle: `${r.filled}/${r.segments} preenchido`, href: getContentEntityHref(campaignId, "NARRATIVE_CLOCK", r.id), updatedAt: r.updatedAt })),
    ...mysteries.map((r) => ({ type: "MYSTERY" as const, id: r.id, title: r.title, subtitle: MYSTERY_STATUS_LABELS[r.status], href: getContentEntityHref(campaignId, "MYSTERY", r.id), updatedAt: r.updatedAt })),
    ...monsters.map((r) => ({ type: "MONSTER" as const, id: r.id, title: r.name, subtitle: r.isBoss ? "Chefe" : "Monstro", href: getContentEntityHref(campaignId, "MONSTER", r.id), updatedAt: r.updatedAt })),
    ...items.map((r) => ({ type: "ITEM" as const, id: r.id, title: r.name, subtitle: r.category, href: getContentEntityHref(campaignId, "ITEM", r.id), updatedAt: r.updatedAt })),
    ...powers.map((r) => ({ type: "POWER" as const, id: r.id, title: r.name, subtitle: r.cost, href: getContentEntityHref(campaignId, "POWER", r.id), updatedAt: r.updatedAt })),
    ...rollTablesGeneric.map((r) => ({ type: "ROLL_TABLE_GENERIC" as const, id: r.id, title: r.name, subtitle: null, href: getContentEntityHref(campaignId, "ROLL_TABLE_GENERIC", r.id), updatedAt: r.updatedAt })),
    ...rollTablesLoot.map((r) => ({ type: "ROLL_TABLE_LOOT" as const, id: r.id, title: r.name, subtitle: null, href: getContentEntityHref(campaignId, "ROLL_TABLE_LOOT", r.id), updatedAt: r.updatedAt })),
    ...sessionPlans.map((r) => ({ type: "SESSION_PLAN" as const, id: r.id, title: r.title, subtitle: SESSION_PLAN_STATUS_LABELS[r.status], href: getContentEntityHref(campaignId, "SESSION_PLAN", r.id), updatedAt: r.updatedAt })),
  ];

  return items_.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}
