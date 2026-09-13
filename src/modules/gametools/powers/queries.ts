import "server-only";

import { db } from "@/lib/db";
import type { CampaignRole } from "@/generated/prisma/client";
import { entityForRole, requireCampaignAccess, visibilityWhereForRole } from "@/modules/core/permissions";
import type { WikiListFilters } from "@/modules/creation/wiki-filters";

export function listPowers(campaignId: string, filters: WikiListFilters, role: CampaignRole) {
  return db.power.findMany({
    where: {
      campaignId,
      archived: filters.archived ?? false,
      favorite: filters.favorite ? true : undefined,
      canonStatus: filters.status,
      visibility: visibilityWhereForRole(role),
      name: filters.q ? { contains: filters.q, mode: "insensitive" } : undefined,
      tags: filters.tag ? { some: { tag: { slug: filters.tag } } } : undefined,
    },
    orderBy: { updatedAt: "desc" },
    include: { tags: { include: { tag: true } } },
  });
}

export async function getPowerForUser(userId: string, campaignId: string, powerId: string) {
  const { role } = await requireCampaignAccess(userId, campaignId);
  const power = await db.power.findFirst({
    where: { id: powerId, campaignId },
    include: { tags: { include: { tag: true } } },
  });
  return entityForRole(power, role);
}

export function countPowers(campaignId: string) {
  return db.power.count({ where: { campaignId, archived: false } });
}
