import "server-only";

import { db } from "@/lib/db";
import { requireCampaignAccess } from "@/modules/core/permissions";
import type { WikiListFilters } from "@/modules/creation/wiki-filters";

export function listItems(campaignId: string, filters: WikiListFilters) {
  return db.item.findMany({
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

export async function getItemForUser(userId: string, campaignId: string, itemId: string) {
  await requireCampaignAccess(userId, campaignId);
  return db.item.findFirst({
    where: { id: itemId, campaignId },
    include: { tags: { include: { tag: true } } },
  });
}

export function countItems(campaignId: string) {
  return db.item.count({ where: { campaignId, archived: false } });
}
