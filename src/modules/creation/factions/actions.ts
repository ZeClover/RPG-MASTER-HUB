"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { relationshipsInvolvingEntity } from "@/modules/creation/relationships/queries";
import { factionFormSchema, type FactionFormInput } from "@/modules/creation/factions/schemas";

export type FactionFormState =
  | {
      errors?: Partial<Record<keyof FactionFormInput, string[]>>;
      message?: string;
    }
  | undefined;

function rawEntries(formData: FormData) {
  return {
    name: formData.get("name"),
    imageUrl: formData.get("imageUrl"),
    factionType: formData.get("factionType"),
    description: formData.get("description"),
    history: formData.get("history"),
    goals: formData.get("goals"),
    resources: formData.get("resources"),
    secrets: formData.get("secrets"),
    notes: formData.get("notes"),
    canonStatus: formData.get("canonStatus"),
    visibility: formData.get("visibility"),
  };
}

function n(value: string | undefined) {
  return value ? value : null;
}

function buildFactionData(data: FactionFormInput) {
  return {
    name: data.name,
    imageUrl: n(data.imageUrl),
    factionType: n(data.factionType),
    description: n(data.description),
    history: n(data.history),
    goals: n(data.goals),
    resources: n(data.resources),
    secrets: n(data.secrets),
    notes: n(data.notes),
    canonStatus: data.canonStatus,
    visibility: data.visibility,
  };
}

async function syncFactionTags(factionId: string, tagIds: string[]) {
  await db.factionTag.deleteMany({ where: { factionId, tagId: { notIn: tagIds } } });
  if (tagIds.length > 0) {
    await db.factionTag.createMany({ data: tagIds.map((tagId) => ({ factionId, tagId })), skipDuplicates: true });
  }
}

export async function createFactionAction(
  campaignId: string,
  _prevState: FactionFormState,
  formData: FormData,
): Promise<FactionFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = factionFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  const faction = await db.faction.create({
    data: {
      ...buildFactionData(parsed.data),
      campaignId,
      tags: tagIds.length > 0 ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
  });

  revalidatePath(`/campaigns/${campaignId}/factions`);
  redirect(`/campaigns/${campaignId}/factions/${faction.id}`);
}

export async function updateFactionAction(
  campaignId: string,
  factionId: string,
  _prevState: FactionFormState,
  formData: FormData,
): Promise<FactionFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = factionFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  await db.faction.update({ where: { id: factionId }, data: buildFactionData(parsed.data) });
  await syncFactionTags(factionId, tagIds);

  revalidatePath(`/campaigns/${campaignId}/factions`);
  revalidatePath(`/campaigns/${campaignId}/factions/${factionId}`);
  redirect(`/campaigns/${campaignId}/factions/${factionId}`);
}

export async function toggleFactionFavoriteAction(campaignId: string, factionId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const faction = await db.faction.findFirst({ where: { id: factionId, campaignId }, select: { favorite: true } });
  if (!faction) return;

  await db.faction.update({ where: { id: factionId }, data: { favorite: !faction.favorite } });
  revalidatePath(`/campaigns/${campaignId}/factions`);
  revalidatePath(`/campaigns/${campaignId}/factions/${factionId}`);
}

export async function toggleFactionArchivedAction(campaignId: string, factionId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const faction = await db.faction.findFirst({ where: { id: factionId, campaignId }, select: { archived: true } });
  if (!faction) return;

  await db.faction.update({ where: { id: factionId }, data: { archived: !faction.archived } });
  revalidatePath(`/campaigns/${campaignId}/factions`);
  revalidatePath(`/campaigns/${campaignId}/factions/${factionId}`);
}

export async function deleteFactionAction(campaignId: string, factionId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.$transaction([
    db.relationship.deleteMany({ where: { campaignId, ...relationshipsInvolvingEntity("FACTION", factionId) } }),
    db.faction.delete({ where: { id: factionId } }),
  ]);

  revalidatePath(`/campaigns/${campaignId}/factions`);
  redirect(`/campaigns/${campaignId}/factions`);
}
