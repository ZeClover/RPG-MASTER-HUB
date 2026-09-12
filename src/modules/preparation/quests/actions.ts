"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { relationshipsInvolvingEntity } from "@/modules/creation/relationships/queries";
import { questFormSchema, type QuestFormInput } from "@/modules/preparation/quests/schemas";

export type QuestFormState =
  | {
      errors?: Partial<Record<keyof QuestFormInput, string[]>>;
      message?: string;
    }
  | undefined;

function rawEntries(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    objective: formData.get("objective"),
    reward: formData.get("reward"),
    status: formData.get("status"),
    visibility: formData.get("visibility"),
  };
}

function n(value: string | undefined) {
  return value ? value : null;
}

function buildQuestData(data: QuestFormInput) {
  return {
    title: data.title,
    description: n(data.description),
    objective: n(data.objective),
    reward: n(data.reward),
    status: data.status,
    visibility: data.visibility,
  };
}

async function syncQuestTags(questId: string, tagIds: string[]) {
  await db.questTag.deleteMany({ where: { questId, tagId: { notIn: tagIds } } });
  if (tagIds.length > 0) {
    await db.questTag.createMany({ data: tagIds.map((tagId) => ({ questId, tagId })), skipDuplicates: true });
  }
}

export async function createQuestAction(
  campaignId: string,
  _prevState: QuestFormState,
  formData: FormData,
): Promise<QuestFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = questFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  const quest = await db.quest.create({
    data: {
      ...buildQuestData(parsed.data),
      campaignId,
      tags: tagIds.length > 0 ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
  });

  revalidatePath(`/campaigns/${campaignId}/quests`);
  redirect(`/campaigns/${campaignId}/quests/${quest.id}`);
}

export async function updateQuestAction(
  campaignId: string,
  questId: string,
  _prevState: QuestFormState,
  formData: FormData,
): Promise<QuestFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = questFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  await db.quest.update({ where: { id: questId }, data: buildQuestData(parsed.data) });
  await syncQuestTags(questId, tagIds);

  revalidatePath(`/campaigns/${campaignId}/quests`);
  revalidatePath(`/campaigns/${campaignId}/quests/${questId}`);
  redirect(`/campaigns/${campaignId}/quests/${questId}`);
}

export async function toggleQuestFavoriteAction(campaignId: string, questId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const quest = await db.quest.findFirst({ where: { id: questId, campaignId }, select: { favorite: true } });
  if (!quest) return;

  await db.quest.update({ where: { id: questId }, data: { favorite: !quest.favorite } });
  revalidatePath(`/campaigns/${campaignId}/quests`);
  revalidatePath(`/campaigns/${campaignId}/quests/${questId}`);
}

export async function toggleQuestArchivedAction(campaignId: string, questId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const quest = await db.quest.findFirst({ where: { id: questId, campaignId }, select: { archived: true } });
  if (!quest) return;

  await db.quest.update({ where: { id: questId }, data: { archived: !quest.archived } });
  revalidatePath(`/campaigns/${campaignId}/quests`);
  revalidatePath(`/campaigns/${campaignId}/quests/${questId}`);
}

export async function deleteQuestAction(campaignId: string, questId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.$transaction([
    db.relationship.deleteMany({ where: { campaignId, ...relationshipsInvolvingEntity("QUEST", questId) } }),
    db.quest.delete({ where: { id: questId } }),
  ]);

  revalidatePath(`/campaigns/${campaignId}/quests`);
  redirect(`/campaigns/${campaignId}/quests`);
}
