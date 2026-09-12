"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { checklistItemFormSchema } from "@/modules/preparation/session-plans/schemas";

export type ChecklistItemFormState = { error?: string } | undefined;

function revalidateSessionPlan(campaignId: string, sessionPlanId: string) {
  revalidatePath(`/campaigns/${campaignId}/session-plans/${sessionPlanId}`);
}

export async function addChecklistItemAction(
  campaignId: string,
  sessionPlanId: string,
  _prevState: ChecklistItemFormState,
  formData: FormData,
): Promise<ChecklistItemFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = checklistItemFormSchema.safeParse({ label: formData.get("label") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Item inválido." };
  }

  const last = await db.checklistItem.findFirst({
    where: { sessionPlanId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await db.checklistItem.create({
    data: { sessionPlanId, label: parsed.data.label, order: (last?.order ?? -1) + 1 },
  });

  revalidateSessionPlan(campaignId, sessionPlanId);
}

export async function toggleChecklistItemAction(campaignId: string, sessionPlanId: string, itemId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const item = await db.checklistItem.findFirst({ where: { id: itemId, sessionPlanId }, select: { done: true } });
  if (!item) return;

  await db.checklistItem.update({ where: { id: itemId }, data: { done: !item.done } });
  revalidateSessionPlan(campaignId, sessionPlanId);
}

export async function deleteChecklistItemAction(campaignId: string, sessionPlanId: string, itemId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.checklistItem.delete({ where: { id: itemId } });
  revalidateSessionPlan(campaignId, sessionPlanId);
}
