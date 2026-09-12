import "server-only";

import { db } from "@/lib/db";
import { requireCampaignAccess } from "@/modules/core/permissions";

export function listActiveCampaignsForUser(userId: string) {
  return db.campaign.findMany({
    where: { members: { some: { userId } }, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
  });
}

export function listArchivedCampaignsForUser(userId: string) {
  return db.campaign.findMany({
    where: { members: { some: { userId } }, status: "ARCHIVED" },
    orderBy: { archivedAt: "desc" },
  });
}

export async function getCampaignForUser(userId: string, campaignId: string) {
  const membership = await requireCampaignAccess(userId, campaignId);
  return { campaign: membership.campaign, role: membership.role };
}

export function countCampaignMembers(campaignId: string) {
  return db.campaignMember.count({ where: { campaignId } });
}
