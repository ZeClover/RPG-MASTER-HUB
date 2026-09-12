"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import type { FamilyRelationType } from "@/generated/prisma/client";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess } from "@/modules/core/permissions";
import { familyRelationFormSchema } from "@/modules/worldbuilding/family-tree/schemas";

export type FamilyRelationFormState = { error?: string } | undefined;

function revalidateFamily(campaignId: string, npcId?: string) {
  revalidatePath(`/campaigns/${campaignId}/family-tree`);
  if (npcId) revalidatePath(`/campaigns/${campaignId}/npcs/${npcId}`);
}

export async function createFamilyRelationAction(
  campaignId: string,
  currentNpcId: string,
  _prevState: FamilyRelationFormState,
  formData: FormData,
): Promise<FamilyRelationFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = familyRelationFormSchema.safeParse({
    perspective: formData.get("perspective"),
    otherNpcId: formData.get("otherNpcId"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { perspective, otherNpcId, notes } = parsed.data;

  if (otherNpcId === currentNpcId) {
    return { error: "Um NPC não pode ter parentesco consigo mesmo." };
  }

  let npcAId: string;
  let npcBId: string;
  let relationType: FamilyRelationType;

  if (perspective === "PARENT_OF_FORWARD") {
    npcAId = currentNpcId;
    npcBId = otherNpcId;
    relationType = "PARENT_OF";
  } else if (perspective === "PARENT_OF_BACKWARD") {
    npcAId = otherNpcId;
    npcBId = currentNpcId;
    relationType = "PARENT_OF";
  } else if (perspective === "SPOUSE_OF") {
    npcAId = currentNpcId;
    npcBId = otherNpcId;
    relationType = "SPOUSE_OF";
  } else {
    npcAId = currentNpcId;
    npcBId = otherNpcId;
    relationType = "SIBLING_OF";
  }

  const [npcA, npcB] = await Promise.all([
    db.npc.findFirst({ where: { id: npcAId, campaignId }, select: { id: true } }),
    db.npc.findFirst({ where: { id: npcBId, campaignId }, select: { id: true } }),
  ]);
  if (!npcA || !npcB) {
    return { error: "NPC não encontrado nesta campanha." };
  }

  const existing = await db.familyRelation.findFirst({
    where: { npcAId, npcBId, relationType },
    select: { id: true },
  });
  if (existing) {
    return { error: "Esse parentesco já está registrado." };
  }

  await db.familyRelation.create({
    data: { campaignId, npcAId, npcBId, relationType, notes: notes || null },
  });

  revalidateFamily(campaignId, currentNpcId);
  revalidateFamily(campaignId, otherNpcId);
}

export async function deleteFamilyRelationAction(campaignId: string, relationId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const relation = await db.familyRelation.findFirst({ where: { id: relationId, campaignId } });
  if (!relation) return;

  await db.familyRelation.delete({ where: { id: relationId } });

  revalidateFamily(campaignId, relation.npcAId);
  revalidateFamily(campaignId, relation.npcBId);
}
