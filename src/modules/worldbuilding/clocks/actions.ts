"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { clockFormSchema, type ClockFormInput } from "@/modules/worldbuilding/clocks/schemas";

export type ClockFormState =
  | {
      errors?: Partial<Record<keyof ClockFormInput, string[]>>;
      message?: string;
    }
  | undefined;

function n(value: string | undefined) {
  return value ? value : null;
}

function revalidateClocks(campaignId: string) {
  revalidatePath(`/campaigns/${campaignId}/clocks`);
}

export async function createClockAction(
  campaignId: string,
  _prevState: ClockFormState,
  formData: FormData,
): Promise<ClockFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = clockFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    segments: formData.get("segments"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.narrativeClock.create({
    data: {
      campaignId,
      title: parsed.data.title,
      description: n(parsed.data.description),
      segments: parsed.data.segments,
      filled: 0,
    },
  });

  revalidateClocks(campaignId);
}

export async function updateClockAction(
  campaignId: string,
  clockId: string,
  _prevState: ClockFormState,
  formData: FormData,
): Promise<ClockFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = clockFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    segments: formData.get("segments"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const clock = await db.narrativeClock.findFirst({ where: { id: clockId, campaignId }, select: { filled: true } });
  if (!clock) return { message: "Relógio não encontrado." };

  await db.narrativeClock.update({
    where: { id: clockId },
    data: {
      title: parsed.data.title,
      description: n(parsed.data.description),
      segments: parsed.data.segments,
      // Preenchidos nunca ultrapassam o novo total de segmentos, caso o mestre diminua o relógio.
      filled: Math.min(clock.filled, parsed.data.segments),
    },
  });

  revalidateClocks(campaignId);
}

export async function setClockFilledAction(campaignId: string, clockId: string, delta: number) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const clock = await db.narrativeClock.findFirst({
    where: { id: clockId, campaignId },
    select: { filled: true, segments: true },
  });
  if (!clock) return;

  const nextFilled = Math.max(0, Math.min(clock.segments, clock.filled + delta));
  if (nextFilled === clock.filled) return;

  await db.narrativeClock.update({ where: { id: clockId }, data: { filled: nextFilled } });
  revalidateClocks(campaignId);
}

export async function toggleClockFavoriteAction(campaignId: string, clockId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const clock = await db.narrativeClock.findFirst({ where: { id: clockId, campaignId }, select: { favorite: true } });
  if (!clock) return;

  await db.narrativeClock.update({ where: { id: clockId }, data: { favorite: !clock.favorite } });
  revalidateClocks(campaignId);
}

export async function toggleClockArchivedAction(campaignId: string, clockId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const clock = await db.narrativeClock.findFirst({ where: { id: clockId, campaignId }, select: { archived: true } });
  if (!clock) return;

  await db.narrativeClock.update({ where: { id: clockId }, data: { archived: !clock.archived } });
  revalidateClocks(campaignId);
}

export async function deleteClockAction(campaignId: string, clockId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.narrativeClock.delete({ where: { id: clockId } });
  revalidateClocks(campaignId);
}
