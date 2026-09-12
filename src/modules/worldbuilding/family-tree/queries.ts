import "server-only";

import { db } from "@/lib/db";

const npcRefSelect = { id: true, name: true, imageUrl: true, archived: true } as const;

export function listFamilyRelations(campaignId: string) {
  return db.familyRelation.findMany({
    where: { campaignId },
    include: { npcA: { select: npcRefSelect }, npcB: { select: npcRefSelect } },
    orderBy: { createdAt: "asc" },
  });
}

export function listFamilyRelationsForNpc(campaignId: string, npcId: string) {
  return db.familyRelation.findMany({
    where: { campaignId, OR: [{ npcAId: npcId }, { npcBId: npcId }] },
    include: { npcA: { select: npcRefSelect }, npcB: { select: npcRefSelect } },
    orderBy: { createdAt: "asc" },
  });
}
