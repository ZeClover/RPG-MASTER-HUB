import "server-only";

import { db } from "@/lib/db";
import { requireCampaignAccess } from "@/modules/core/permissions";
import type { WikiListFilters } from "@/modules/creation/wiki-filters";

export function listLorePages(campaignId: string, filters: WikiListFilters) {
  return db.lorePage.findMany({
    where: {
      campaignId,
      archived: filters.archived ?? false,
      favorite: filters.favorite ? true : undefined,
      canonStatus: filters.status,
      title: filters.q ? { contains: filters.q, mode: "insensitive" } : undefined,
      tags: filters.tag ? { some: { tag: { slug: filters.tag } } } : undefined,
    },
    orderBy: { updatedAt: "desc" },
    include: { tags: { include: { tag: true } } },
  });
}

export async function getLorePageForUser(userId: string, campaignId: string, lorePageId: string) {
  await requireCampaignAccess(userId, campaignId);
  return db.lorePage.findFirst({
    where: { id: lorePageId, campaignId },
    include: { tags: { include: { tag: true } } },
  });
}

export function countLorePages(campaignId: string) {
  return db.lorePage.count({ where: { campaignId, archived: false } });
}
