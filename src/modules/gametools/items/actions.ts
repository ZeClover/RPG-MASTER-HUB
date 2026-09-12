"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { relationshipsInvolvingEntity } from "@/modules/creation/relationships/queries";
import { itemFormSchema, type ItemFormInput } from "@/modules/gametools/items/schemas";

export type ItemFormState =
  | {
      errors?: Partial<Record<keyof ItemFormInput, string[]>>;
      message?: string;
    }
  | undefined;

function rawEntries(formData: FormData) {
  return {
    name: formData.get("name"),
    imageUrl: formData.get("imageUrl"),
    category: formData.get("category"),
    description: formData.get("description"),
    effect: formData.get("effect"),
    canonStatus: formData.get("canonStatus"),
    visibility: formData.get("visibility"),
  };
}

function n(value: string | undefined) {
  return value ? value : null;
}

function buildItemData(data: ItemFormInput) {
  return {
    name: data.name,
    imageUrl: n(data.imageUrl),
    category: n(data.category),
    description: n(data.description),
    effect: n(data.effect),
    canonStatus: data.canonStatus,
    visibility: data.visibility,
  };
}

async function syncItemTags(itemId: string, tagIds: string[]) {
  await db.itemTag.deleteMany({ where: { itemId, tagId: { notIn: tagIds } } });
  if (tagIds.length > 0) {
    await db.itemTag.createMany({ data: tagIds.map((tagId) => ({ itemId, tagId })), skipDuplicates: true });
  }
}

export async function createItemAction(
  campaignId: string,
  _prevState: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = itemFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  const item = await db.item.create({
    data: {
      ...buildItemData(parsed.data),
      campaignId,
      tags: tagIds.length > 0 ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
  });

  revalidatePath(`/campaigns/${campaignId}/items`);
  redirect(`/campaigns/${campaignId}/items/${item.id}`);
}

export async function updateItemAction(
  campaignId: string,
  itemId: string,
  _prevState: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = itemFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  await db.item.update({ where: { id: itemId }, data: buildItemData(parsed.data) });
  await syncItemTags(itemId, tagIds);

  revalidatePath(`/campaigns/${campaignId}/items`);
  revalidatePath(`/campaigns/${campaignId}/items/${itemId}`);
  redirect(`/campaigns/${campaignId}/items/${itemId}`);
}

export async function toggleItemFavoriteAction(campaignId: string, itemId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const item = await db.item.findFirst({ where: { id: itemId, campaignId }, select: { favorite: true } });
  if (!item) return;

  await db.item.update({ where: { id: itemId }, data: { favorite: !item.favorite } });
  revalidatePath(`/campaigns/${campaignId}/items`);
  revalidatePath(`/campaigns/${campaignId}/items/${itemId}`);
}

export async function toggleItemArchivedAction(campaignId: string, itemId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const item = await db.item.findFirst({ where: { id: itemId, campaignId }, select: { archived: true } });
  if (!item) return;

  await db.item.update({ where: { id: itemId }, data: { archived: !item.archived } });
  revalidatePath(`/campaigns/${campaignId}/items`);
  revalidatePath(`/campaigns/${campaignId}/items/${itemId}`);
}

export async function deleteItemAction(campaignId: string, itemId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.$transaction([
    db.relationship.deleteMany({ where: { campaignId, ...relationshipsInvolvingEntity("ITEM", itemId) } }),
    db.item.delete({ where: { id: itemId } }),
  ]);

  revalidatePath(`/campaigns/${campaignId}/items`);
  redirect(`/campaigns/${campaignId}/items`);
}
