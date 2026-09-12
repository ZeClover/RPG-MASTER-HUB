import "server-only";

import { db } from "@/lib/db";

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
  | "ITEM";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
}

/** Busca dentro de uma campanha por nome/título, descrição/conteúdo e tags — sem IA, só query estruturada. */
export async function searchCampaign(campaignId: string, query: string, limit = 8): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const insensitive = { contains: trimmed, mode: "insensitive" as const };
  const byTag = { tags: { some: { tag: { name: insensitive } } } };

  const [npcs, locations, factions, lorePages, ideas, quests, plotThreads, consequences, monsters, items] = await Promise.all([
    db.npc.findMany({
      where: { campaignId, OR: [{ name: insensitive }, { personality: insensitive }, { history: insensitive }, byTag] },
      take: limit,
      select: { id: true, name: true, species: true },
    }),
    db.location.findMany({
      where: { campaignId, OR: [{ name: insensitive }, { description: insensitive }, byTag] },
      take: limit,
      select: { id: true, name: true, locationType: true },
    }),
    db.faction.findMany({
      where: { campaignId, OR: [{ name: insensitive }, { description: insensitive }, byTag] },
      take: limit,
      select: { id: true, name: true, factionType: true },
    }),
    db.lorePage.findMany({
      where: { campaignId, OR: [{ title: insensitive }, { content: insensitive }, byTag] },
      take: limit,
      select: { id: true, title: true, category: true },
    }),
    db.idea.findMany({
      where: { campaignId, OR: [{ title: insensitive }, { content: insensitive }, byTag] },
      take: limit,
      select: { id: true, title: true },
    }),
    db.quest.findMany({
      where: { campaignId, OR: [{ title: insensitive }, { description: insensitive }, { objective: insensitive }, byTag] },
      take: limit,
      select: { id: true, title: true },
    }),
    db.plotThread.findMany({
      where: { campaignId, OR: [{ title: insensitive }, { description: insensitive }, byTag] },
      take: limit,
      select: { id: true, title: true },
    }),
    db.consequence.findMany({
      where: { campaignId, OR: [{ title: insensitive }, { trigger: insensitive }, { description: insensitive }, byTag] },
      take: limit,
      select: { id: true, title: true },
    }),
    db.monster.findMany({
      where: { campaignId, OR: [{ name: insensitive }, { description: insensitive }, byTag] },
      take: limit,
      select: { id: true, name: true, isBoss: true },
    }),
    db.item.findMany({
      where: { campaignId, OR: [{ name: insensitive }, { description: insensitive }, { effect: insensitive }, byTag] },
      take: limit,
      select: { id: true, name: true, category: true },
    }),
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
  ];

  return results;
}
