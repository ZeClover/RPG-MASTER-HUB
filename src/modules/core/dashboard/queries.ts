import "server-only";

import { db } from "@/lib/db";
import type { SearchResultType } from "@/modules/core/search/queries";

export interface DashboardEntityRef {
  type: SearchResultType;
  id: string;
  name: string;
  href: string;
  updatedAt: Date;
}

interface RawRows {
  npcs: { id: string; name: string; updatedAt: Date }[];
  locations: { id: string; name: string; updatedAt: Date }[];
  factions: { id: string; name: string; updatedAt: Date }[];
  lorePages: { id: string; title: string; updatedAt: Date }[];
  ideas: { id: string; title: string; updatedAt: Date }[];
}

function toRefs(campaignId: string, rows: RawRows): DashboardEntityRef[] {
  return [
    ...rows.npcs.map((row) => ({
      type: "NPC" as const,
      id: row.id,
      name: row.name,
      href: `/campaigns/${campaignId}/npcs/${row.id}`,
      updatedAt: row.updatedAt,
    })),
    ...rows.locations.map((row) => ({
      type: "LOCATION" as const,
      id: row.id,
      name: row.name,
      href: `/campaigns/${campaignId}/locations/${row.id}`,
      updatedAt: row.updatedAt,
    })),
    ...rows.factions.map((row) => ({
      type: "FACTION" as const,
      id: row.id,
      name: row.name,
      href: `/campaigns/${campaignId}/factions/${row.id}`,
      updatedAt: row.updatedAt,
    })),
    ...rows.lorePages.map((row) => ({
      type: "LORE_PAGE" as const,
      id: row.id,
      name: row.title,
      href: `/campaigns/${campaignId}/lore/${row.id}`,
      updatedAt: row.updatedAt,
    })),
    ...rows.ideas.map((row) => ({
      type: "IDEA" as const,
      id: row.id,
      name: row.title,
      href: `/campaigns/${campaignId}/ideas`,
      updatedAt: row.updatedAt,
    })),
  ];
}

async function fetchAcrossEntities(campaignId: string, limit: number, favoriteOnly: boolean): Promise<RawRows> {
  const where = { campaignId, archived: false, favorite: favoriteOnly ? true : undefined };
  const orderBy = { updatedAt: "desc" as const };

  const [npcs, locations, factions, lorePages, ideas] = await Promise.all([
    db.npc.findMany({ where, orderBy, take: limit, select: { id: true, name: true, updatedAt: true } }),
    db.location.findMany({ where, orderBy, take: limit, select: { id: true, name: true, updatedAt: true } }),
    db.faction.findMany({ where, orderBy, take: limit, select: { id: true, name: true, updatedAt: true } }),
    db.lorePage.findMany({ where, orderBy, take: limit, select: { id: true, title: true, updatedAt: true } }),
    db.idea.findMany({ where, orderBy, take: limit, select: { id: true, title: true, updatedAt: true } }),
  ]);

  return { npcs, locations, factions, lorePages, ideas };
}

export async function listRecentEntities(campaignId: string, limit = 6): Promise<DashboardEntityRef[]> {
  const rows = await fetchAcrossEntities(campaignId, limit, false);
  return toRefs(campaignId, rows)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);
}

export async function listFavoriteEntities(campaignId: string, limit = 6): Promise<DashboardEntityRef[]> {
  const rows = await fetchAcrossEntities(campaignId, limit, true);
  return toRefs(campaignId, rows)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);
}
