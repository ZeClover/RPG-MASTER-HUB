"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { sessionPlanFormSchema, type SessionPlanFormInput } from "@/modules/preparation/session-plans/schemas";

export type SessionPlanFormState =
  | {
      errors?: Partial<Record<keyof SessionPlanFormInput, string[]>>;
      message?: string;
    }
  | undefined;

function rawEntries(formData: FormData) {
  return {
    title: formData.get("title"),
    sessionNumber: formData.get("sessionNumber"),
    plannedDate: formData.get("plannedDate"),
    pitch: formData.get("pitch"),
    gmNotes: formData.get("gmNotes"),
    status: formData.get("status"),
  };
}

function n(value: string | undefined) {
  return value ? value : null;
}

function buildSessionPlanData(data: SessionPlanFormInput) {
  return {
    title: data.title,
    sessionNumber: data.sessionNumber ? Number(data.sessionNumber) : null,
    plannedDate: data.plannedDate ? new Date(data.plannedDate) : null,
    pitch: n(data.pitch),
    gmNotes: n(data.gmNotes),
    status: data.status,
  };
}

export async function createSessionPlanAction(
  campaignId: string,
  _prevState: SessionPlanFormState,
  formData: FormData,
): Promise<SessionPlanFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = sessionPlanFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const sessionPlan = await db.sessionPlan.create({
    data: { ...buildSessionPlanData(parsed.data), campaignId },
  });

  revalidatePath(`/campaigns/${campaignId}/session-plans`);
  redirect(`/campaigns/${campaignId}/session-plans/${sessionPlan.id}`);
}

export async function updateSessionPlanAction(
  campaignId: string,
  sessionPlanId: string,
  _prevState: SessionPlanFormState,
  formData: FormData,
): Promise<SessionPlanFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = sessionPlanFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.sessionPlan.update({ where: { id: sessionPlanId }, data: buildSessionPlanData(parsed.data) });

  revalidatePath(`/campaigns/${campaignId}/session-plans`);
  revalidatePath(`/campaigns/${campaignId}/session-plans/${sessionPlanId}`);
  redirect(`/campaigns/${campaignId}/session-plans/${sessionPlanId}`);
}

export async function toggleSessionPlanFavoriteAction(campaignId: string, sessionPlanId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const sessionPlan = await db.sessionPlan.findFirst({
    where: { id: sessionPlanId, campaignId },
    select: { favorite: true },
  });
  if (!sessionPlan) return;

  await db.sessionPlan.update({ where: { id: sessionPlanId }, data: { favorite: !sessionPlan.favorite } });
  revalidatePath(`/campaigns/${campaignId}/session-plans`);
  revalidatePath(`/campaigns/${campaignId}/session-plans/${sessionPlanId}`);
}

export async function toggleSessionPlanArchivedAction(campaignId: string, sessionPlanId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const sessionPlan = await db.sessionPlan.findFirst({
    where: { id: sessionPlanId, campaignId },
    select: { archived: true },
  });
  if (!sessionPlan) return;

  await db.sessionPlan.update({ where: { id: sessionPlanId }, data: { archived: !sessionPlan.archived } });
  revalidatePath(`/campaigns/${campaignId}/session-plans`);
  revalidatePath(`/campaigns/${campaignId}/session-plans/${sessionPlanId}`);
}

export async function deleteSessionPlanAction(campaignId: string, sessionPlanId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  // Cenas e itens de checklist são filhos diretos (FK real, não polimórfica) —
  // o `onDelete: Cascade` do schema já cuida da limpeza, sem precisar de transação manual aqui.
  await db.sessionPlan.delete({ where: { id: sessionPlanId } });

  revalidatePath(`/campaigns/${campaignId}/session-plans`);
  redirect(`/campaigns/${campaignId}/session-plans`);
}
