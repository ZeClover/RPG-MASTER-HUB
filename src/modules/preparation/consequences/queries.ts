import "server-only";

import { db } from "@/lib/db";
import type { CampaignRole, ConsequenceStatus } from "@/generated/prisma/client";
import { entityForRole, requireCampaignAccess, visibilityWhereForRole } from "@/modules/core/permissions";
import type { WikiListFilters } from "@/modules/creation/wiki-filters";

export function listConsequences(campaignId: string, filters: WikiListFilters<ConsequenceStatus>, role: CampaignRole) {
  return db.consequence.findMany({
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

export async function getConsequenceForUser(userId: string, campaignId: string, consequenceId: string) {
  const { role } = await requireCampaignAccess(userId, campaignId);
  const consequence = await db.consequence.findFirst({
    where: { id: consequenceId, campaignId },
    include: { tags: { include: { tag: true } } },
  });
  return entityForRole(consequence, role);
}

export function countConsequences(campaignId: string) {
  return db.consequence.count({ where: { campaignId, archived: false } });
}
