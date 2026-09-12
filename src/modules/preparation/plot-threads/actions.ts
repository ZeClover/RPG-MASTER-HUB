"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { relationshipsInvolvingEntity } from "@/modules/creation/relationships/queries";
import { plotThreadFormSchema, type PlotThreadFormInput } from "@/modules/preparation/plot-threads/schemas";

export type PlotThreadFormState =
  | {
      errors?: Partial<Record<keyof PlotThreadFormInput, string[]>>;
      message?: string;
    }
  | undefined;

function rawEntries(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    importance: formData.get("importance"),
    visibility: formData.get("visibility"),
  };
}

function n(value: string | undefined) {
  return value ? value : null;
}

function buildPlotThreadData(data: PlotThreadFormInput) {
  return {
    title: data.title,
    description: n(data.description),
    status: data.status,
    importance: data.importance,
    visibility: data.visibility,
  };
}

async function syncPlotThreadTags(plotThreadId: string, tagIds: string[]) {
  await db.plotThreadTag.deleteMany({ where: { plotThreadId, tagId: { notIn: tagIds } } });
  if (tagIds.length > 0) {
    await db.plotThreadTag.createMany({
      data: tagIds.map((tagId) => ({ plotThreadId, tagId })),
      skipDuplicates: true,
    });
  }
}

export async function createPlotThreadAction(
  campaignId: string,
  _prevState: PlotThreadFormState,
  formData: FormData,
): Promise<PlotThreadFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = plotThreadFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  const plotThread = await db.plotThread.create({
    data: {
      ...buildPlotThreadData(parsed.data),
      campaignId,
      tags: tagIds.length > 0 ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
  });

  revalidatePath(`/campaigns/${campaignId}/plot-threads`);
  redirect(`/campaigns/${campaignId}/plot-threads/${plotThread.id}`);
}

export async function updatePlotThreadAction(
  campaignId: string,
  plotThreadId: string,
  _prevState: PlotThreadFormState,
  formData: FormData,
): Promise<PlotThreadFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = plotThreadFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  await db.plotThread.update({ where: { id: plotThreadId }, data: buildPlotThreadData(parsed.data) });
  await syncPlotThreadTags(plotThreadId, tagIds);

  revalidatePath(`/campaigns/${campaignId}/plot-threads`);
  revalidatePath(`/campaigns/${campaignId}/plot-threads/${plotThreadId}`);
  redirect(`/campaigns/${campaignId}/plot-threads/${plotThreadId}`);
}

export async function togglePlotThreadFavoriteAction(campaignId: string, plotThreadId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const plotThread = await db.plotThread.findFirst({
    where: { id: plotThreadId, campaignId },
    select: { favorite: true },
  });
  if (!plotThread) return;

  await db.plotThread.update({ where: { id: plotThreadId }, data: { favorite: !plotThread.favorite } });
  revalidatePath(`/campaigns/${campaignId}/plot-threads`);
  revalidatePath(`/campaigns/${campaignId}/plot-threads/${plotThreadId}`);
}

export async function togglePlotThreadArchivedAction(campaignId: string, plotThreadId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const plotThread = await db.plotThread.findFirst({
    where: { id: plotThreadId, campaignId },
    select: { archived: true },
  });
  if (!plotThread) return;

  await db.plotThread.update({ where: { id: plotThreadId }, data: { archived: !plotThread.archived } });
  revalidatePath(`/campaigns/${campaignId}/plot-threads`);
  revalidatePath(`/campaigns/${campaignId}/plot-threads/${plotThreadId}`);
}

export async function deletePlotThreadAction(campaignId: string, plotThreadId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.$transaction([
    db.relationship.deleteMany({
      where: { campaignId, ...relationshipsInvolvingEntity("PLOT_THREAD", plotThreadId) },
    }),
    db.plotThread.delete({ where: { id: plotThreadId } }),
  ]);

  revalidatePath(`/campaigns/${campaignId}/plot-threads`);
  redirect(`/campaigns/${campaignId}/plot-threads`);
}
