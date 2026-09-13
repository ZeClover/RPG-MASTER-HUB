"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { handoutFormSchema, type HandoutFormInput } from "@/modules/players/handouts/schemas";

export type HandoutFormState =
  | { errors?: Partial<Record<keyof HandoutFormInput, string[]>>; message?: string }
  | undefined;

export async function createHandoutAction(
  campaignId: string,
  _prevState: HandoutFormState,
  formData: FormData,
): Promise<HandoutFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = handoutFormSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    imageUrl: formData.get("imageUrl"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.handout.create({
    data: {
      campaignId,
      title: parsed.data.title,
      content: parsed.data.content || null,
      imageUrl: parsed.data.imageUrl || null,
    },
  });

  revalidatePath(`/campaigns/${campaignId}/handouts`);
}

export async function toggleHandoutRevealedAction(campaignId: string, handoutId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const handout = await db.handout.findFirst({ where: { id: handoutId, campaignId } });
  if (!handout) return;

  await db.handout.update({
    where: { id: handoutId },
    data: { revealed: !handout.revealed, revealedAt: handout.revealed ? null : new Date() },
  });

  revalidatePath(`/campaigns/${campaignId}/handouts`);
}

export async function deleteHandoutAction(campaignId: string, handoutId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  await db.handout.deleteMany({ where: { id: handoutId, campaignId } });
  revalidatePath(`/campaigns/${campaignId}/handouts`);
}
