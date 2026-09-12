"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { relationshipsInvolvingEntity } from "@/modules/creation/relationships/queries";
import { mysteryFormSchema, type MysteryFormInput } from "@/modules/worldbuilding/mysteries/schemas";

export type MysteryFormState =
  | {
      errors?: Partial<Record<keyof MysteryFormInput, string[]>>;
      message?: string;
    }
  | undefined;

function rawEntries(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    visibility: formData.get("visibility"),
  };
}

function n(value: string | undefined) {
  return value ? value : null;
}

function buildMysteryData(data: MysteryFormInput) {
  return {
    title: data.title,
    description: n(data.description),
    status: data.status,
    visibility: data.visibility,
  };
}

async function syncMysteryTags(mysteryId: string, tagIds: string[]) {
  await db.mysteryTag.deleteMany({ where: { mysteryId, tagId: { notIn: tagIds } } });
  if (tagIds.length > 0) {
    await db.mysteryTag.createMany({ data: tagIds.map((tagId) => ({ mysteryId, tagId })), skipDuplicates: true });
  }
}

export async function createMysteryAction(
  campaignId: string,
  _prevState: MysteryFormState,
  formData: FormData,
): Promise<MysteryFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = mysteryFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  const mystery = await db.mystery.create({
    data: {
      ...buildMysteryData(parsed.data),
      campaignId,
      tags: tagIds.length > 0 ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
  });

  revalidatePath(`/campaigns/${campaignId}/mysteries`);
  redirect(`/campaigns/${campaignId}/mysteries/${mystery.id}`);
}

export async function updateMysteryAction(
  campaignId: string,
  mysteryId: string,
  _prevState: MysteryFormState,
  formData: FormData,
): Promise<MysteryFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = mysteryFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  await db.mystery.update({ where: { id: mysteryId }, data: buildMysteryData(parsed.data) });
  await syncMysteryTags(mysteryId, tagIds);

  revalidatePath(`/campaigns/${campaignId}/mysteries`);
  revalidatePath(`/campaigns/${campaignId}/mysteries/${mysteryId}`);
  redirect(`/campaigns/${campaignId}/mysteries/${mysteryId}`);
}

export async function toggleMysteryFavoriteAction(campaignId: string, mysteryId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const mystery = await db.mystery.findFirst({ where: { id: mysteryId, campaignId }, select: { favorite: true } });
  if (!mystery) return;

  await db.mystery.update({ where: { id: mysteryId }, data: { favorite: !mystery.favorite } });
  revalidatePath(`/campaigns/${campaignId}/mysteries`);
  revalidatePath(`/campaigns/${campaignId}/mysteries/${mysteryId}`);
}

export async function toggleMysteryArchivedAction(campaignId: string, mysteryId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const mystery = await db.mystery.findFirst({ where: { id: mysteryId, campaignId }, select: { archived: true } });
  if (!mystery) return;

  await db.mystery.update({ where: { id: mysteryId }, data: { archived: !mystery.archived } });
  revalidatePath(`/campaigns/${campaignId}/mysteries`);
  revalidatePath(`/campaigns/${campaignId}/mysteries/${mysteryId}`);
}

export async function deleteMysteryAction(campaignId: string, mysteryId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.$transaction([
    db.relationship.deleteMany({ where: { campaignId, ...relationshipsInvolvingEntity("MYSTERY", mysteryId) } }),
    db.mystery.delete({ where: { id: mysteryId } }),
  ]);

  revalidatePath(`/campaigns/${campaignId}/mysteries`);
  redirect(`/campaigns/${campaignId}/mysteries`);
}
