import "server-only";

import { db } from "@/lib/db";
import type { CampaignRole } from "@/generated/prisma/client";
import { CAMPAIGN_ROLE_RANK } from "@/lib/roles";

export class CampaignAccessError extends Error {
  constructor(message = "Você não tem acesso a esta campanha.") {
    super(message);
    this.name = "CampaignAccessError";
  }
}

/**
 * Único ponto de checagem de permissão por campanha. Toda action/rota que lê ou
 * altera dados de uma campanha deve passar por aqui — nunca confiar apenas na UI.
 */
export async function requireCampaignAccess(
  userId: string,
  campaignId: string,
  minRole: CampaignRole = "PLAYER",
) {
  const membership = await db.campaignMember.findUnique({
    where: { campaignId_userId: { campaignId, userId } },
    include: { campaign: true },
  });

  if (!membership || CAMPAIGN_ROLE_RANK[membership.role] < CAMPAIGN_ROLE_RANK[minRole]) {
    throw new CampaignAccessError();
  }

  return membership;
}

export * from "@/modules/core/permissions/visibility";
