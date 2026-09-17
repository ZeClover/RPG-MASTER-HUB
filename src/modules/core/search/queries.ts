import "server-only";

import { db } from "@/lib/db";
import { requireCampaignAccess, visibilityWhereForRole } from "@/modules/core/permissions";
import { getEnabledModuleKeys } from "@/modules/core/campaigns/module-settings";
import { CAMPAIGN_NAV_ITEMS } from "@/components/layout/campaign-nav-items";

export type SearchResultType =
  | "NPC"
  | "LOCATION"
  | "FACTION"
  | "LORE_PAGE"
  | "IDEA"
  | "QUEST"
  | "PLOT_THREAD"
  | "CONSEQUENCE"
  | "MONSTER"
  | "ITEM"
  | "POWER"
  | "CHARACTER"
  | "TIMELINE_EVENT"
  | "MYSTERY"
  | "HANDOUT"
  | "CUSTOM_CATEGORY_ENTRY"
  | "SESSION_PLAN";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
}

/**
 * Cada tipo de resultado à `key` do módulo correspondente em
 * `CAMPAIGN_NAV_ITEMS` (Fase 11, ver ARCHITECTURE.md, seção 22) — usado para
 * nunca mostrar, na busca, um resultado de um módulo que o mestre desligou
 * para esta campanha (mesmo raciocínio do Dashboard orientado a módulo).
 */
const SEARCH_RESULT_MODULE_KEY: Record<SearchResultType, string> = {
  NPC: "npcs",
  LOCATION: "locations",
  FACTION: "factions",
  LORE_PAGE: "lore",
  IDEA: "ideas",
  QUEST: "quests",
  PLOT_THREAD: "plot-threads",
  CONSEQUENCE: "consequences",
  MONSTER: "monsters",
  ITEM: "items",
  POWER: "powers",
  CHARACTER: "characters",
  TIMELINE_EVENT: "timeline",
  MYSTERY: "mysteries",
  HANDOUT: "handouts",
  CUSTOM_CATEGORY_ENTRY: "custom-categories",
  SESSION_PLAN: "session-plans",
};

const ALWAYS_ON_MODULE_KEYS = new Set(
  CAMPAIGN_NAV_ITEMS.filter((item) => item.alwaysOn).map((item) => item.key),
);

/**
 * Busca dentro de uma campanha por nome/título, descrição/conteúdo e tags —
 * sem IA, só query estruturada.
 *
 * Fase 11 (ver ARCHITECTURE.md, seção 22) reescreveu esta função inteira para
 * corrigir um vazamento de visibilidade pré-existente: a versão anterior não
 * recebia `role`/`userId` nenhum e não aplicava NENHUM filtro de
 * `visibility`, mesmo com 10 dos seus 11 tipos de resultado tendo esse campo
 * — um PLAYER conseguia encontrar (título/subtítulo) NPCs, monstros,
 * mistérios etc. `GM_ONLY` pela busca e pelo Command Palette (Ctrl+K), os
 * dois únicos pontos de leitura desta campanha que nunca passavam por
 * `visibilityWhereForRole`. Corrigido junto da extensão para os 6 tipos
 * novos, já que reescrever a função era inevitável de qualquer forma.
 */
export async function searchCampaign(
  userId: string,
  campaignId: string,
  query: string,
  limit = 8,
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { role } = await requireCampaignAccess(userId, campaignId);
  const visibility = visibilityWhereForRole(role);
  const enabledModuleKeys = await getEnabledModuleKeys(campaignId);

  const insensitive = { contains: trimmed, mode: "insensitive" as const };
  const byTag = { tags: { some: { tag: { name: insensitive } } } };

  const [
    npcs,
    locations,
    factions,
    lorePages,
    ideas,
    quests,
    plotThreads,
    consequences,
    monsters,
    items,
    powers,
    characters,
    timelineEvents,
    mysteries,
    handouts,
    customCategoryEntries,
    sessionPlans,
  ] = await Promise.all([
    db.npc.findMany({
      where: { campaignId, visibility, OR: [{ name: insensitive }, { personality: insensitive }, { history: insensitive }, byTag] },
      take: limit,
      select: { id: true, name: true, species: true },
    }),
    db.location.findMany({
      where: { campaignId, visibility, OR: [{ name: insensitive }, { description: insensitive }, byTag] },
      take: limit,
      select: { id: true, name: true, locationType: true },
    }),
    db.faction.findMany({
      where: { campaignId, visibility, OR: [{ name: insensitive }, { description: insensitive }, byTag] },
      take: limit,
      select: { id: true, name: true, factionType: true },
    }),
    db.lorePage.findMany({
      where: { campaignId, visibility, OR: [{ title: insensitive }, { content: insensitive }, byTag] },
      take: limit,
      select: { id: true, title: true, category: true },
    }),
    // Idea não tem campo `visibility` (nunca teve — não é conteúdo GM/jogador, é rascunho livre).
    db.idea.findMany({
      where: { campaignId, OR: [{ title: insensitive }, { content: insensitive }, byTag] },
      take: limit,
      select: { id: true, title: true },
    }),
    db.quest.findMany({
      where: { campaignId, visibility, OR: [{ title: insensitive }, { description: insensitive }, { objective: insensitive }, byTag] },
      take: limit,
      select: { id: true, title: true },
    }),
    db.plotThread.findMany({
      where: { campaignId, visibility, OR: [{ title: insensitive }, { description: insensitive }, byTag] },
      take: limit,
      select: { id: true, title: true },
    }),
    db.consequence.findMany({
      where: { campaignId, visibility, OR: [{ title: insensitive }, { trigger: insensitive }, { description: insensitive }, byTag] },
      take: limit,
      select: { id: true, title: true },
    }),
    db.monster.findMany({
      where: { campaignId, visibility, OR: [{ name: insensitive }, { description: insensitive }, byTag] },
      take: limit,
      select: { id: true, name: true, isBoss: true },
    }),
    db.item.findMany({
      where: { campaignId, visibility, OR: [{ name: insensitive }, { description: insensitive }, { effect: insensitive }, byTag] },
      take: limit,
      select: { id: true, name: true, category: true },
    }),
    db.power.findMany({
      where: { campaignId, visibility, OR: [{ name: insensitive }, { description: insensitive }, { effect: insensitive }, byTag] },
      take: limit,
      select: { id: true, name: true, cost: true },
    }),
    // Character é visto por toda a mesa por design (Fase 10) — sem filtro de `visibility`. Nunca
    // inclui `gmNotes` no predicado de match: o campo nem precisa "vazar" pra ser um problema,
    // ser buscável já revelaria que a nota contém o termo buscado (ver nota geral no fim).
    db.character.findMany({
      where: { campaignId, OR: [{ name: insensitive }, { concept: insensitive }, { bio: insensitive }] },
      take: limit,
      select: { id: true, name: true, concept: true },
    }),
    db.timelineEvent.findMany({
      where: { campaignId, visibility, OR: [{ title: insensitive }, { description: insensitive }, byTag] },
      take: limit,
      select: { id: true, title: true, narrativeDate: true },
    }),
    db.mystery.findMany({
      where: { campaignId, visibility, OR: [{ title: insensitive }, { description: insensitive }, byTag] },
      take: limit,
      select: { id: true, title: true, status: true },
    }),
    // Handout: mesmo corte de `listHandouts` — PLAYER só vê revelados, CO_GM/OWNER veem todos.
    db.handout.findMany({
      where: { campaignId, revealed: role === "PLAYER" ? true : undefined, OR: [{ title: insensitive }, { content: insensitive }] },
      take: limit,
      select: { id: true, title: true },
    }),
    db.customCategoryEntry.findMany({
      where: { category: { campaignId }, visibility, OR: [{ title: insensitive }, { content: insensitive }] },
      take: limit,
      select: { id: true, title: true, categoryId: true, category: { select: { name: true } } },
    }),
    // SessionPlan é material de preparação do mestre, sem `visibility` — nunca deveria nem tocar
    // a tabela para um PLAYER (não é só "esconder o resultado", é "nunca rodar a query"). Nunca
    // inclui `gmNotes` no predicado de match, pelo mesmo motivo do Character acima.
    role !== "PLAYER"
      ? db.sessionPlan.findMany({
          where: { campaignId, OR: [{ title: insensitive }, { pitch: insensitive }] },
          take: limit,
          select: { id: true, title: true, sessionNumber: true },
        })
      : Promise.resolve([]),
  ]);

  const results: SearchResult[] = [
    ...npcs.map((npc) => ({
      type: "NPC" as const,
      id: npc.id,
      title: npc.name,
      subtitle: npc.species,
      href: `/campaigns/${campaignId}/npcs/${npc.id}`,
    })),
    ...locations.map((location) => ({
      type: "LOCATION" as const,
      id: location.id,
      title: location.name,
      subtitle: location.locationType,
      href: `/campaigns/${campaignId}/locations/${location.id}`,
    })),
    ...factions.map((faction) => ({
      type: "FACTION" as const,
      id: faction.id,
      title: faction.name,
      subtitle: faction.factionType,
      href: `/campaigns/${campaignId}/factions/${faction.id}`,
    })),
    ...lorePages.map((page) => ({
      type: "LORE_PAGE" as const,
      id: page.id,
      title: page.title,
      subtitle: page.category,
      href: `/campaigns/${campaignId}/lore/${page.id}`,
    })),
    ...ideas.map((idea) => ({
      type: "IDEA" as const,
      id: idea.id,
      title: idea.title,
      subtitle: null,
      href: `/campaigns/${campaignId}/ideas`,
    })),
    ...quests.map((quest) => ({
      type: "QUEST" as const,
      id: quest.id,
      title: quest.title,
      subtitle: null,
      href: `/campaigns/${campaignId}/quests/${quest.id}`,
    })),
    ...plotThreads.map((thread) => ({
      type: "PLOT_THREAD" as const,
      id: thread.id,
      title: thread.title,
      subtitle: null,
      href: `/campaigns/${campaignId}/plot-threads/${thread.id}`,
    })),
    ...consequences.map((consequence) => ({
      type: "CONSEQUENCE" as const,
      id: consequence.id,
      title: consequence.title,
      subtitle: null,
      href: `/campaigns/${campaignId}/consequences/${consequence.id}`,
    })),
    ...monsters.map((monster) => ({
      type: "MONSTER" as const,
      id: monster.id,
      title: monster.name,
      subtitle: monster.isBoss ? "Chefe" : "Monstro",
      href: `/campaigns/${campaignId}/monsters/${monster.id}`,
    })),
    ...items.map((item) => ({
      type: "ITEM" as const,
      id: item.id,
      title: item.name,
      subtitle: item.category,
      href: `/campaigns/${campaignId}/items/${item.id}`,
    })),
    ...powers.map((power) => ({
      type: "POWER" as const,
      id: power.id,
      title: power.name,
      subtitle: power.cost,
      href: `/campaigns/${campaignId}/powers/${power.id}`,
    })),
    ...characters.map((character) => ({
      type: "CHARACTER" as const,
      id: character.id,
      title: character.name,
      subtitle: character.concept,
      href: `/campaigns/${campaignId}/characters/${character.id}`,
    })),
    ...timelineEvents.map((event) => ({
      type: "TIMELINE_EVENT" as const,
      id: event.id,
      title: event.title,
      subtitle: event.narrativeDate,
      href: `/campaigns/${campaignId}/timeline/${event.id}`,
    })),
    ...mysteries.map((mystery) => ({
      type: "MYSTERY" as const,
      id: mystery.id,
      title: mystery.title,
      subtitle: mystery.status === "OPEN" ? "Aberto" : "Resolvido",
      href: `/campaigns/${campaignId}/mysteries/${mystery.id}`,
    })),
    ...handouts.map((handout) => ({
      type: "HANDOUT" as const,
      id: handout.id,
      title: handout.title,
      subtitle: null,
      href: `/campaigns/${campaignId}/handouts`,
    })),
    ...customCategoryEntries.map((entry) => ({
      type: "CUSTOM_CATEGORY_ENTRY" as const,
      id: entry.id,
      title: entry.title,
      subtitle: entry.category.name,
      href: `/campaigns/${campaignId}/custom-categories/${entry.categoryId}`,
    })),
    ...sessionPlans.map((plan) => ({
      type: "SESSION_PLAN" as const,
      id: plan.id,
      title: plan.title,
      subtitle: plan.sessionNumber ? `Sessão ${plan.sessionNumber}` : null,
      href: `/campaigns/${campaignId}/session-plans/${plan.id}`,
    })),
  ];

  return results.filter((result) => {
    const moduleKey = SEARCH_RESULT_MODULE_KEY[result.type];
    return ALWAYS_ON_MODULE_KEYS.has(moduleKey) || enabledModuleKeys.has(moduleKey);
  });
}
