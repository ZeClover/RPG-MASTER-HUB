import "server-only";

import { db } from "@/lib/db";
import { requireCampaignAccess } from "@/modules/core/permissions";

/** PLAYER só vê handouts já revelados; CO_GM/OWNER veem todos (ver ARCHITECTURE.md, seção 21.4). */
export async function listHandouts(userId: string, campaignId: string) {
  const { role } = await requireCampaignAccess(userId, campaignId);

  return db.handout.findMany({
    where: role === "PLAYER" ? { campaignId, revealed: true } : { campaignId },
    orderBy: { createdAt: "desc" },
  });
}
