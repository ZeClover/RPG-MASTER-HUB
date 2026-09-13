import "server-only";

import { db } from "@/lib/db";
import type { CampaignRole } from "@/generated/prisma/client";
import { entityForRole, requireCampaignAccess, visibilityWhereForRole } from "@/modules/core/permissions";
import type { WikiListFilters } from "@/modules/creation/wiki-filters";

export function listMonsters(campaignId: string, filters: WikiListFilters, role: CampaignRole) {
  return db.monster.findMany({
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

export async function getMonsterForUser(userId: string, campaignId: string, monsterId: string) {
  const { role } = await requireCampaignAccess(userId, campaignId);
  const monster = await db.monster.findFirst({
    where: { id: monsterId, campaignId },
    include: {
      tags: { include: { tag: true } },
      attributes: { orderBy: { order: "asc" } },
    },
  });
  return entityForRole(monster, role);
}

export function countMonsters(campaignId: string) {
  return db.monster.count({ where: { campaignId, archived: false } });
}
