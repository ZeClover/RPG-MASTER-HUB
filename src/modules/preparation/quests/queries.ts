import "server-only";

import { db } from "@/lib/db";
import type { QuestStatus } from "@/generated/prisma/client";
import { requireCampaignAccess } from "@/modules/core/permissions";
import type { WikiListFilters } from "@/modules/creation/wiki-filters";

export function listQuests(campaignId: string, filters: WikiListFilters<QuestStatus>) {
  return db.quest.findMany({
    where: {
      campaignId,
      archived: filters.archived ?? false,
      favorite: filters.favorite ? true : undefined,
      status: filters.status,
      title: filters.q ? { contains: filters.q, mode: "insensitive" } : undefined,
      tags: filters.tag ? { some: { tag: { slug: filters.tag } } } : undefined,
    },
    orderBy: { updatedAt: "desc" },
    include: { tags: { include: { tag: true } } },
  });
}

export async function getQuestForUser(userId: string, campaignId: string, questId: string) {
  await requireCampaignAccess(userId, campaignId);
  return db.quest.findFirst({
    where: { id: questId, campaignId },
    include: { tags: { include: { tag: true } } },
  });
}

export function countQuests(campaignId: string) {
  return db.quest.count({ where: { campaignId, archived: false } });
}
