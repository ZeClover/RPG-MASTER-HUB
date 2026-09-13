import "server-only";

import { db } from "@/lib/db";
import type { CampaignRole } from "@/generated/prisma/client";
import { isPlayerRole } from "@/modules/core/permissions";

const npcRefSelect = { id: true, name: true, imageUrl: true, archived: true } as const;

/**
 * Player View (Fase 9, ver ARCHITECTURE.md, seção 21.2): um parentesco entre
 * dois NPCs vaza o nome do "outro lado" mesmo quando visto a partir do NPC
 * visível — por isso, para PLAYER, ambos os lados do parentesco precisam ter
 * `visibility` diferente de GM_ONLY, não só o NPC cuja página está aberta.
 */
function visibilityFilterForRole(role: CampaignRole) {
  if (!isPlayerRole(role)) return {};
  const notGmOnly = { visibility: { not: "GM_ONLY" as const } };
  return { npcA: notGmOnly, npcB: notGmOnly };
}

export function listFamilyRelations(campaignId: string, role: CampaignRole) {
  return db.familyRelation.findMany({
    where: { campaignId, ...visibilityFilterForRole(role) },
    include: { npcA: { select: npcRefSelect }, npcB: { select: npcRefSelect } },
    orderBy: { createdAt: "asc" },
  });
}

export function listFamilyRelationsForNpc(campaignId: string, npcId: string, role: CampaignRole) {
  return db.familyRelation.findMany({
    where: { campaignId, OR: [{ npcAId: npcId }, { npcBId: npcId }], ...visibilityFilterForRole(role) },
    include: { npcA: { select: npcRefSelect }, npcB: { select: npcRefSelect } },
    orderBy: { createdAt: "asc" },
  });
}
