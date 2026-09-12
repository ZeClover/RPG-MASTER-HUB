import "server-only";

import { db } from "@/lib/db";
import type { IdeaState } from "@/generated/prisma/client";
import { requireCampaignAccess } from "@/modules/core/permissions";

export interface IdeaListFilters {
  q?: string;
  tag?: string;
  state?: IdeaState;
  favorite?: boolean;
  archived?: boolean;
}

export function listIdeas(campaignId: string, filters: IdeaListFilters) {
  return db.idea.findMany({
    where: {
      campaignId,
      archived: filters.archived ?? false,
      favorite: filters.favorite ? true : undefined,
      state: filters.state,
      title: filters.q ? { contains: filters.q, mode: "insensitive" } : undefined,
      tags: filters.tag ? { some: { tag: { slug: filters.tag } } } : undefined,
    },
    orderBy: { createdAt: "desc" },
    include: { tags: { include: { tag: true } } },
  });
}

export async function getIdeaForUser(userId: string, campaignId: string, ideaId: string) {
  await requireCampaignAccess(userId, campaignId);
  return db.idea.findFirst({
    where: { id: ideaId, campaignId },
    include: { tags: { include: { tag: true } } },
  });
}

export function countIdeas(campaignId: string) {
  return db.idea.count({ where: { campaignId, archived: false } });
}
