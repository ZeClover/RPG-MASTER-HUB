import "server-only";

import { db } from "@/lib/db";
import { CAMPAIGN_ROLE_RANK } from "@/lib/roles";

export interface CampaignMemberRow {
  id: string;
  role: "OWNER" | "CO_GM" | "PLAYER";
  joinedAt: Date;
  user: { id: string; name: string | null; email: string; image: string | null };
}

/**
 * Membros de uma campanha, sempre com a OWNER (dona) primeiro, depois
 * Co-Mestres, depois Jogadores — a ordenação usa o mesmo ranking de
 * `requireCampaignAccess` (não a ordem alfabética do enum), então a UI nunca
 * precisa reordenar de novo.
 */
export async function listCampaignMembers(campaignId: string): Promise<CampaignMemberRow[]> {
  const members = await db.campaignMember.findMany({
    where: { campaignId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return members.sort((a, b) => CAMPAIGN_ROLE_RANK[b.role] - CAMPAIGN_ROLE_RANK[a.role]);
}
