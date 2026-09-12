import "server-only";

import { db } from "@/lib/db";
import { requireCampaignAccess } from "@/modules/core/permissions";
import type { WikiListFilters } from "@/modules/creation/wiki-filters";

export function listFactions(campaignId: string, filters: WikiListFilters) {
  return db.faction.findMany({
    where: {
      campaignId,
      archived: filters.archived ?? false,
      favorite: filters.favorite ? true : undefined,
      canonStatus: filters.status,
      name: filters.q ? { contains: filters.q, mode: "insensitive" } : undefined,
      tags: filters.tag ? { some: { tag: { slug: filters.tag } } } : undefined,
    },
    orderBy: { updatedAt: "desc" },
    include: { tags: { include: { tag: true } } },
  });
}

export async function getFactionForUser(userId: string, campaignId: string, factionId: string) {
  await requireCampaignAccess(userId, campaignId);
  return db.faction.findFirst({
    where: { id: factionId, campaignId },
    include: { tags: { include: { tag: true } } },
  });
}

export function countFactions(campaignId: string) {
  return db.faction.count({ where: { campaignId, archived: false } });
}
