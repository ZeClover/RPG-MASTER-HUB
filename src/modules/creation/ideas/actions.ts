"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { ideaFormSchema, quickIdeaSchema, type IdeaFormInput } from "@/modules/creation/ideas/schemas";

export type QuickIdeaFormState = { error?: string } | undefined;

export async function quickCreateIdeaAction(
  campaignId: string,
  _prevState: QuickIdeaFormState,
  formData: FormData,
): Promise<QuickIdeaFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = quickIdeaSchema.safeParse({ title: formData.get("title") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Escreva alguma coisa." };
  }

  await db.idea.create({ data: { campaignId, title: parsed.data.title } });
  revalidatePath(`/campaigns/${campaignId}/ideas`);
}

export type IdeaFormState =
  | {
      errors?: Partial<Record<keyof IdeaFormInput, string[]>>;
    }
  | undefined;

function rawEntries(formData: FormData) {
  return {
    title: formData.get("title"),
    content: formData.get("content"),
    state: formData.get("state"),
  };
}

async function syncIdeaTags(ideaId: string, tagIds: string[]) {
  await db.ideaTag.deleteMany({ where: { ideaId, tagId: { notIn: tagIds } } });
  if (tagIds.length > 0) {
    await db.ideaTag.createMany({ data: tagIds.map((tagId) => ({ ideaId, tagId })), skipDuplicates: true });
  }
}

export async function updateIdeaAction(
  campaignId: string,
  ideaId: string,
  _prevState: IdeaFormState,
  formData: FormData,
): Promise<IdeaFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = ideaFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  await db.idea.update({
    where: { id: ideaId },
    data: {
      title: parsed.data.title,
      content: parsed.data.content || null,
      state: parsed.data.state,
    },
  });
  await syncIdeaTags(ideaId, tagIds);

  revalidatePath(`/campaigns/${campaignId}/ideas`);
}

export async function toggleIdeaFavoriteAction(campaignId: string, ideaId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const idea = await db.idea.findFirst({ where: { id: ideaId, campaignId }, select: { favorite: true } });
  if (!idea) return;

  await db.idea.update({ where: { id: ideaId }, data: { favorite: !idea.favorite } });
  revalidatePath(`/campaigns/${campaignId}/ideas`);
}

export async function toggleIdeaArchivedAction(campaignId: string, ideaId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const idea = await db.idea.findFirst({ where: { id: ideaId, campaignId }, select: { archived: true } });
  if (!idea) return;

  await db.idea.update({ where: { id: ideaId }, data: { archived: !idea.archived } });
  revalidatePath(`/campaigns/${campaignId}/ideas`);
}

export async function deleteIdeaAction(campaignId: string, ideaId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.idea.delete({ where: { id: ideaId } });
  revalidatePath(`/campaigns/${campaignId}/ideas`);
}
