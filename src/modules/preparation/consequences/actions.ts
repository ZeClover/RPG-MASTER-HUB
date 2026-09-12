"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { relationshipsInvolvingEntity } from "@/modules/creation/relationships/queries";
import { consequenceFormSchema, type ConsequenceFormInput } from "@/modules/preparation/consequences/schemas";

export type ConsequenceFormState =
  | {
      errors?: Partial<Record<keyof ConsequenceFormInput, string[]>>;
      message?: string;
    }
  | undefined;

function rawEntries(formData: FormData) {
  return {
    title: formData.get("title"),
    trigger: formData.get("trigger"),
    description: formData.get("description"),
    status: formData.get("status"),
    visibility: formData.get("visibility"),
  };
}

function n(value: string | undefined) {
  return value ? value : null;
}

function buildConsequenceData(data: ConsequenceFormInput) {
  return {
    title: data.title,
    trigger: n(data.trigger),
    description: n(data.description),
    status: data.status,
    visibility: data.visibility,
  };
}

async function syncConsequenceTags(consequenceId: string, tagIds: string[]) {
  await db.consequenceTag.deleteMany({ where: { consequenceId, tagId: { notIn: tagIds } } });
  if (tagIds.length > 0) {
    await db.consequenceTag.createMany({
      data: tagIds.map((tagId) => ({ consequenceId, tagId })),
      skipDuplicates: true,
    });
  }
}

export async function createConsequenceAction(
  campaignId: string,
  _prevState: ConsequenceFormState,
  formData: FormData,
): Promise<ConsequenceFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = consequenceFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  const consequence = await db.consequence.create({
    data: {
      ...buildConsequenceData(parsed.data),
      campaignId,
      tags: tagIds.length > 0 ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
  });

  revalidatePath(`/campaigns/${campaignId}/consequences`);
  redirect(`/campaigns/${campaignId}/consequences/${consequence.id}`);
}

export async function updateConsequenceAction(
  campaignId: string,
  consequenceId: string,
  _prevState: ConsequenceFormState,
  formData: FormData,
): Promise<ConsequenceFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = consequenceFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  await db.consequence.update({ where: { id: consequenceId }, data: buildConsequenceData(parsed.data) });
  await syncConsequenceTags(consequenceId, tagIds);

  revalidatePath(`/campaigns/${campaignId}/consequences`);
  revalidatePath(`/campaigns/${campaignId}/consequences/${consequenceId}`);
  redirect(`/campaigns/${campaignId}/consequences/${consequenceId}`);
}

export async function toggleConsequenceFavoriteAction(campaignId: string, consequenceId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const consequence = await db.consequence.findFirst({
    where: { id: consequenceId, campaignId },
    select: { favorite: true },
  });
  if (!consequence) return;

  await db.consequence.update({ where: { id: consequenceId }, data: { favorite: !consequence.favorite } });
  revalidatePath(`/campaigns/${campaignId}/consequences`);
  revalidatePath(`/campaigns/${campaignId}/consequences/${consequenceId}`);
}

export async function toggleConsequenceArchivedAction(campaignId: string, consequenceId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const consequence = await db.consequence.findFirst({
    where: { id: consequenceId, campaignId },
    select: { archived: true },
  });
  if (!consequence) return;

  await db.consequence.update({ where: { id: consequenceId }, data: { archived: !consequence.archived } });
  revalidatePath(`/campaigns/${campaignId}/consequences`);
  revalidatePath(`/campaigns/${campaignId}/consequences/${consequenceId}`);
}

export async function deleteConsequenceAction(campaignId: string, consequenceId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.$transaction([
    db.relationship.deleteMany({
      where: { campaignId, ...relationshipsInvolvingEntity("CONSEQUENCE", consequenceId) },
    }),
    db.consequence.delete({ where: { id: consequenceId } }),
  ]);

  revalidatePath(`/campaigns/${campaignId}/consequences`);
  redirect(`/campaigns/${campaignId}/consequences`);
}
