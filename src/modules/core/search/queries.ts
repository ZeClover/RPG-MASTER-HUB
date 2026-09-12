import "server-only";

import { db } from "@/lib/db";

export type SearchResultType = "NPC" | "LOCATION" | "FACTION" | "LORE_PAGE" | "IDEA";

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

  const [npcs, locations, factions, lorePages, ideas] = await Promise.all([
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
  ];

  return results;
}
