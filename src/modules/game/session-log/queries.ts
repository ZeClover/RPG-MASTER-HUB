import "server-only";

import { db } from "@/lib/db";
import { requireCampaignAccess } from "@/modules/core/permissions";

export async function listLogEntries(userId: string, campaignId: string, limit = 100) {
  await requireCampaignAccess(userId, campaignId);
  return db.sessionLogEntry.findMany({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
