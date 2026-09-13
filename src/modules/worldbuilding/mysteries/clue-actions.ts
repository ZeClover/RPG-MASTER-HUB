"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import type { RelatableEntityType } from "@/generated/prisma/client";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { clueFormSchema } from "@/modules/worldbuilding/mysteries/schemas";

export type ClueFormState = { error?: string } | undefined;

function revalidateMystery(campaignId: string, mysteryId: string) {
  revalidatePath(`/campaigns/${campaignId}/mysteries/${mysteryId}`);
}

export async function addClueAction(
  campaignId: string,
  mysteryId: string,
  _prevState: ClueFormState,
  formData: FormData,
): Promise<ClueFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = clueFormSchema.safeParse({ text: formData.get("text") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Pista inválida." };
  }

  const last = await db.clue.findFirst({ where: { mysteryId }, orderBy: { order: "desc" }, select: { order: true } });

  await db.clue.create({
    data: { mysteryId, text: parsed.data.text, order: (last?.order ?? -1) + 1 },
  });

  revalidateMystery(campaignId, mysteryId);
}

export async function toggleClueDiscoveredAction(campaignId: string, mysteryId: string, clueId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const clue = await db.clue.findFirst({ where: { id: clueId, mysteryId }, select: { discovered: true } });
  if (!clue) return;

  await db.clue.update({ where: { id: clueId }, data: { discovered: !clue.discovered } });
  revalidateMystery(campaignId, mysteryId);
}

/**
 * Player Knowledge (Fase 9, ver ARCHITECTURE.md, seção 21.3): liga/desliga
 * `sharedWithPlayers`, o flag que de fato controla o que um PLAYER vê nesta
 * lista de pistas — independente de `discovered`, que é só o controle
 * interno do mestre.
 */
export async function toggleClueSharedAction(campaignId: string, mysteryId: string, clueId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const clue = await db.clue.findFirst({ where: { id: clueId, mysteryId }, select: { sharedWithPlayers: true } });
  if (!clue) return;

  await db.clue.update({ where: { id: clueId }, data: { sharedWithPlayers: !clue.sharedWithPlayers } });
  revalidateMystery(campaignId, mysteryId);
}

export async function linkClueEntityAction(
  campaignId: string,
  mysteryId: string,
  clueId: string,
  entityType: RelatableEntityType | null,
  entityId: string | null,
) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  await db.clue.update({
    where: { id: clueId },
    data: { linkedEntityType: entityType, linkedEntityId: entityType ? entityId : null },
  });

  revalidateMystery(campaignId, mysteryId);
}

export async function deleteClueAction(campaignId: string, mysteryId: string, clueId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.clue.delete({ where: { id: clueId } });
  revalidateMystery(campaignId, mysteryId);
}
