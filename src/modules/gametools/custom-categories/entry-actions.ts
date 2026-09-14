"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { customCategoryEntryFormSchema } from "@/modules/gametools/custom-categories/schemas";

export type CustomCategoryEntryFormState = { error?: string } | undefined;

function n(value: string | undefined) {
  return value ? value : null;
}

function revalidateCategory(campaignId: string, categoryId: string) {
  revalidatePath(`/campaigns/${campaignId}/custom-categories/${categoryId}`);
}

function parseEntryForm(formData: FormData) {
  return customCategoryEntryFormSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    imageUrl: formData.get("imageUrl"),
    visibility: formData.get("visibility") || "GM_ONLY",
  });
}

export async function createEntryAction(
  campaignId: string,
  categoryId: string,
  _prevState: CustomCategoryEntryFormState,
  formData: FormData,
): Promise<CustomCategoryEntryFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = parseEntryForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrada inválida." };
  }

  await db.customCategoryEntry.create({
    data: {
      categoryId,
      title: parsed.data.title,
      content: n(parsed.data.content),
      imageUrl: n(parsed.data.imageUrl),
      visibility: parsed.data.visibility,
    },
  });

  revalidateCategory(campaignId, categoryId);
}

export async function updateEntryAction(
  campaignId: string,
  categoryId: string,
  entryId: string,
  _prevState: CustomCategoryEntryFormState,
  formData: FormData,
): Promise<CustomCategoryEntryFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = parseEntryForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrada inválida." };
  }

  await db.customCategoryEntry.updateMany({
    where: { id: entryId, categoryId },
    data: {
      title: parsed.data.title,
      content: n(parsed.data.content),
      imageUrl: n(parsed.data.imageUrl),
      visibility: parsed.data.visibility,
    },
  });

  revalidateCategory(campaignId, categoryId);
}

export async function deleteEntryAction(campaignId: string, categoryId: string, entryId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  await db.customCategoryEntry.deleteMany({ where: { id: entryId, categoryId } });
  revalidateCategory(campaignId, categoryId);
}
