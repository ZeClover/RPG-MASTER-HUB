import "server-only";

import { db } from "@/lib/db";
import { requireCampaignAccess } from "@/modules/core/permissions";
import type { WikiListFilters } from "@/modules/creation/wiki-filters";

export function listMonsters(campaignId: string, filters: WikiListFilters) {
  return db.monster.findMany({
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

export async function getMonsterForUser(userId: string, campaignId: string, monsterId: string) {
  await requireCampaignAccess(userId, campaignId);
  return db.monster.findFirst({
    where: { id: monsterId, campaignId },
    include: {
      tags: { include: { tag: true } },
      attributes: { orderBy: { order: "asc" } },
    },
  });
}

export function countMonsters(campaignId: string) {
  return db.monster.count({ where: { campaignId, archived: false } });
}
