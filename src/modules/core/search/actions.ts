"use server";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess } from "@/modules/core/permissions";
import { searchCampaign } from "@/modules/core/search/queries";

export async function searchCampaignAction(campaignId: string, query: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId);
  return searchCampaign(campaignId, query);
}
