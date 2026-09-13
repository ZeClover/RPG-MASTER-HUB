import "server-only";

import type { CampaignRole, PlotThreadStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { entityForRole, requireCampaignAccess, visibilityWhereForRole } from "@/modules/core/permissions";
import type { WikiListFilters } from "@/modules/creation/wiki-filters";

export function listPlotThreads(campaignId: string, filters: WikiListFilters<PlotThreadStatus>, role: CampaignRole) {
  return db.plotThread.findMany({
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

export async function getPlotThreadForUser(userId: string, campaignId: string, plotThreadId: string) {
  const { role } = await requireCampaignAccess(userId, campaignId);
  const plotThread = await db.plotThread.findFirst({
    where: { id: plotThreadId, campaignId },
    include: { tags: { include: { tag: true } } },
  });
  return entityForRole(plotThread, role);
}

export function countPlotThreads(campaignId: string) {
  return db.plotThread.count({ where: { campaignId, archived: false } });
}
