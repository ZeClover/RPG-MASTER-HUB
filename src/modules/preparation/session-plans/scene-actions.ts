"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { sceneFormSchema, type SceneFormInput } from "@/modules/preparation/session-plans/schemas";

export type SceneFormState =
  | {
      errors?: Partial<Record<keyof SceneFormInput, string[]>>;
      message?: string;
    }
  | undefined;

function rawEntries(formData: FormData) {
  return {
    title: formData.get("title"),
    // A adição rápida de cena não renderiza summary/readAloud/goal — FormData.get
    // retorna `null` para um campo ausente, e o schema (`.optional()`) só aceita
    // `undefined`, não `null`, então cada opcional precisa cair para "" aqui.
    summary: formData.get("summary") ?? "",
    readAloud: formData.get("readAloud") ?? "",
    goal: formData.get("goal") ?? "",
    status: formData.get("status"),
  };
}

function n(value: string | undefined) {
  return value ? value : null;
}

function revalidateSessionPlan(campaignId: string, sessionPlanId: string) {
  revalidatePath(`/campaigns/${campaignId}/session-plans/${sessionPlanId}`);
}

export async function createSceneAction(
  campaignId: string,
  sessionPlanId: string,
  _prevState: SceneFormState,
  formData: FormData,
): Promise<SceneFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = sceneFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const last = await db.scene.findFirst({ where: { sessionPlanId }, orderBy: { order: "desc" }, select: { order: true } });

  await db.scene.create({
    data: {
      campaignId,
      sessionPlanId,
      title: parsed.data.title,
      summary: n(parsed.data.summary),
      readAloud: n(parsed.data.readAloud),
      goal: n(parsed.data.goal),
      status: parsed.data.status,
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidateSessionPlan(campaignId, sessionPlanId);
}

export async function updateSceneAction(
  campaignId: string,
  sessionPlanId: string,
  sceneId: string,
  _prevState: SceneFormState,
  formData: FormData,
): Promise<SceneFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = sceneFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.scene.update({
    where: { id: sceneId },
    data: {
      title: parsed.data.title,
      summary: n(parsed.data.summary),
      readAloud: n(parsed.data.readAloud),
      goal: n(parsed.data.goal),
      status: parsed.data.status,
    },
  });

  revalidateSessionPlan(campaignId, sessionPlanId);
}

export async function toggleSceneFavoriteAction(campaignId: string, sessionPlanId: string, sceneId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const scene = await db.scene.findFirst({ where: { id: sceneId, sessionPlanId }, select: { favorite: true } });
  if (!scene) return;

  await db.scene.update({ where: { id: sceneId }, data: { favorite: !scene.favorite } });
  revalidateSessionPlan(campaignId, sessionPlanId);
}

export async function moveSceneAction(
  campaignId: string,
  sessionPlanId: string,
  sceneId: string,
  direction: "up" | "down",
) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const scenes = await db.scene.findMany({ where: { sessionPlanId }, orderBy: { order: "asc" } });
  const index = scenes.findIndex((scene) => scene.id === sceneId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= scenes.length) return;

  const current = scenes[index];
  const neighbor = scenes[swapIndex];

  await db.$transaction([
    db.scene.update({ where: { id: current.id }, data: { order: neighbor.order } }),
    db.scene.update({ where: { id: neighbor.id }, data: { order: current.order } }),
  ]);

  revalidateSessionPlan(campaignId, sessionPlanId);
}

export async function deleteSceneAction(campaignId: string, sessionPlanId: string, sceneId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.scene.delete({ where: { id: sceneId } });
  revalidateSessionPlan(campaignId, sessionPlanId);
}
