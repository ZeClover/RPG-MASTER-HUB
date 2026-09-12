"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { relationshipsInvolvingEntity } from "@/modules/creation/relationships/queries";
import { lorePageFormSchema, type LorePageFormInput } from "@/modules/creation/lore/schemas";

export async function previewMarkdownAction(content: string) {
  return renderMarkdown(content.trim() || "*Nada para mostrar ainda.*");
}

export type LorePageFormState =
  | {
      errors?: Partial<Record<keyof LorePageFormInput, string[]>>;
      message?: string;
    }
  | undefined;

function rawEntries(formData: FormData) {
  return {
    title: formData.get("title"),
    content: formData.get("content"),
    imageUrl: formData.get("imageUrl"),
    category: formData.get("category"),
    canonStatus: formData.get("canonStatus"),
    visibility: formData.get("visibility"),
  };
}

function n(value: string | undefined) {
  return value ? value : null;
}

function buildLorePageData(data: LorePageFormInput) {
  return {
    title: data.title,
    content: n(data.content),
    imageUrl: n(data.imageUrl),
    category: n(data.category),
    canonStatus: data.canonStatus,
    visibility: data.visibility,
  };
}

async function syncLorePageTags(lorePageId: string, tagIds: string[]) {
  await db.lorePageTag.deleteMany({ where: { lorePageId, tagId: { notIn: tagIds } } });
  if (tagIds.length > 0) {
    await db.lorePageTag.createMany({ data: tagIds.map((tagId) => ({ lorePageId, tagId })), skipDuplicates: true });
  }
}

export async function createLorePageAction(
  campaignId: string,
  _prevState: LorePageFormState,
  formData: FormData,
): Promise<LorePageFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = lorePageFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  const lorePage = await db.lorePage.create({
    data: {
      ...buildLorePageData(parsed.data),
      campaignId,
      tags: tagIds.length > 0 ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
  });

  revalidatePath(`/campaigns/${campaignId}/lore`);
  redirect(`/campaigns/${campaignId}/lore/${lorePage.id}`);
}

export async function updateLorePageAction(
  campaignId: string,
  lorePageId: string,
  _prevState: LorePageFormState,
  formData: FormData,
): Promise<LorePageFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = lorePageFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  await db.lorePage.update({ where: { id: lorePageId }, data: buildLorePageData(parsed.data) });
  await syncLorePageTags(lorePageId, tagIds);

  revalidatePath(`/campaigns/${campaignId}/lore`);
  revalidatePath(`/campaigns/${campaignId}/lore/${lorePageId}`);
  redirect(`/campaigns/${campaignId}/lore/${lorePageId}`);
}

export async function toggleLorePageFavoriteAction(campaignId: string, lorePageId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const lorePage = await db.lorePage.findFirst({ where: { id: lorePageId, campaignId }, select: { favorite: true } });
  if (!lorePage) return;

  await db.lorePage.update({ where: { id: lorePageId }, data: { favorite: !lorePage.favorite } });
  revalidatePath(`/campaigns/${campaignId}/lore`);
  revalidatePath(`/campaigns/${campaignId}/lore/${lorePageId}`);
}

export async function toggleLorePageArchivedAction(campaignId: string, lorePageId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const lorePage = await db.lorePage.findFirst({ where: { id: lorePageId, campaignId }, select: { archived: true } });
  if (!lorePage) return;

  await db.lorePage.update({ where: { id: lorePageId }, data: { archived: !lorePage.archived } });
  revalidatePath(`/campaigns/${campaignId}/lore`);
  revalidatePath(`/campaigns/${campaignId}/lore/${lorePageId}`);
}

export async function deleteLorePageAction(campaignId: string, lorePageId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.$transaction([
    db.relationship.deleteMany({ where: { campaignId, ...relationshipsInvolvingEntity("LORE_PAGE", lorePageId) } }),
    db.lorePage.delete({ where: { id: lorePageId } }),
  ]);

  revalidatePath(`/campaigns/${campaignId}/lore`);
  redirect(`/campaigns/${campaignId}/lore`);
}
