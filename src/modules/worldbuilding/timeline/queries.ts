import "server-only";

import { db } from "@/lib/db";
import { requireCampaignAccess } from "@/modules/core/permissions";
import type { WikiListFilters } from "@/modules/creation/wiki-filters";

export function listTimelineEvents(campaignId: string, filters: WikiListFilters<never>) {
  return db.timelineEvent.findMany({
    where: {
      campaignId,
      archived: filters.archived ?? false,
      favorite: filters.favorite ? true : undefined,
      title: filters.q ? { contains: filters.q, mode: "insensitive" } : undefined,
      tags: filters.tag ? { some: { tag: { slug: filters.tag } } } : undefined,
    },
    orderBy: { order: "asc" },
    include: { tags: { include: { tag: true } } },
  });
}

export async function getTimelineEventForUser(userId: string, campaignId: string, eventId: string) {
  await requireCampaignAccess(userId, campaignId);
  return db.timelineEvent.findFirst({
    where: { id: eventId, campaignId },
    include: { tags: { include: { tag: true } } },
  });
}

export function countTimelineEvents(campaignId: string) {
  return db.timelineEvent.count({ where: { campaignId, archived: false } });
}
