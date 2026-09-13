import "server-only";

import { db } from "@/lib/db";
import type { CampaignRole, QuestStatus } from "@/generated/prisma/client";
import { entityForRole, requireCampaignAccess, visibilityWhereForRole } from "@/modules/core/permissions";
import type { WikiListFilters } from "@/modules/creation/wiki-filters";

export function listQuests(campaignId: string, filters: WikiListFilters<QuestStatus>, role: CampaignRole) {
  return db.quest.findMany({
    where: {
      campaignId,
      archived: filters.archived ?? false,
      favorite: filters.favorite ? true : undefined,
      status: filters.status,
      visibility: visibilityWhereForRole(role),
      title: filters.q ? { contains: filters.q, mode: "insensitive" } : undefined,
      tags: filters.tag ? { some: { tag: { slug: filters.tag } } } : undefined,
    },
    orderBy: { updatedAt: "desc" },
    include: { tags: { include: { tag: true } } },
  });
}

export async function getQuestForUser(userId: string, campaignId: string, questId: string) {
  const { role } = await requireCampaignAccess(userId, campaignId);
  const quest = await db.quest.findFirst({
    where: { id: questId, campaignId },
    include: { tags: { include: { tag: true } } },
  });
  return entityForRole(quest, role);
}

export function countQuests(campaignId: string) {
  return db.quest.count({ where: { campaignId, archived: false } });
}
