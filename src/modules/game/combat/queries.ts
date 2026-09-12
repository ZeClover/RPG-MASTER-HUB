import "server-only";

import { db } from "@/lib/db";
import { requireCampaignAccess } from "@/modules/core/permissions";

export async function getCurrentEncounter(userId: string, campaignId: string) {
  await requireCampaignAccess(userId, campaignId);
  return db.combatEncounter.findFirst({
    where: { campaignId, endedAt: null },
    orderBy: { createdAt: "desc" },
    include: { combatants: { orderBy: { initiative: "desc" } } },
  });
}
