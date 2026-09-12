import "server-only";

import type { PlotThreadStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireCampaignAccess } from "@/modules/core/permissions";
import type { WikiListFilters } from "@/modules/creation/wiki-filters";

export function listPlotThreads(campaignId: string, filters: WikiListFilters<PlotThreadStatus>) {
  return db.plotThread.findMany({
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

export async function getPlotThreadForUser(userId: string, campaignId: string, plotThreadId: string) {
  await requireCampaignAccess(userId, campaignId);
  return db.plotThread.findFirst({
    where: { id: plotThreadId, campaignId },
    include: { tags: { include: { tag: true } } },
  });
}

export function countPlotThreads(campaignId: string) {
  return db.plotThread.count({ where: { campaignId, archived: false } });
}
