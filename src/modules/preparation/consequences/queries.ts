import "server-only";

import { db } from "@/lib/db";
import type { ConsequenceStatus } from "@/generated/prisma/client";
import { requireCampaignAccess } from "@/modules/core/permissions";
import type { WikiListFilters } from "@/modules/creation/wiki-filters";

export function listConsequences(campaignId: string, filters: WikiListFilters<ConsequenceStatus>) {
  return db.consequence.findMany({
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

export async function getConsequenceForUser(userId: string, campaignId: string, consequenceId: string) {
  await requireCampaignAccess(userId, campaignId);
  return db.consequence.findFirst({
    where: { id: consequenceId, campaignId },
    include: { tags: { include: { tag: true } } },
  });
}

export function countConsequences(campaignId: string) {
  return db.consequence.count({ where: { campaignId, archived: false } });
}
