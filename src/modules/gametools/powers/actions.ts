"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { relationshipsInvolvingEntity } from "@/modules/creation/relationships/queries";
import { powerFormSchema, type PowerFormInput } from "@/modules/gametools/powers/schemas";

export type PowerFormState =
  | {
      errors?: Partial<Record<keyof PowerFormInput, string[]>>;
      message?: string;
    }
  | undefined;

function rawEntries(formData: FormData) {
  return {
    name: formData.get("name"),
    cost: formData.get("cost"),
    description: formData.get("description"),
    effect: formData.get("effect"),
    canonStatus: formData.get("canonStatus"),
    visibility: formData.get("visibility"),
  };
}

function n(value: string | undefined) {
  return value ? value : null;
}

function buildPowerData(data: PowerFormInput) {
  return {
    name: data.name,
    cost: n(data.cost),
    description: n(data.description),
    effect: n(data.effect),
    canonStatus: data.canonStatus,
    visibility: data.visibility,
  };
}

async function syncPowerTags(powerId: string, tagIds: string[]) {
  await db.powerTag.deleteMany({ where: { powerId, tagId: { notIn: tagIds } } });
  if (tagIds.length > 0) {
    await db.powerTag.createMany({ data: tagIds.map((tagId) => ({ powerId, tagId })), skipDuplicates: true });
  }
}

export async function createPowerAction(
  campaignId: string,
  _prevState: PowerFormState,
  formData: FormData,
): Promise<PowerFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = powerFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  const power = await db.power.create({
    data: {
      ...buildPowerData(parsed.data),
      campaignId,
      tags: tagIds.length > 0 ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
  });

  revalidatePath(`/campaigns/${campaignId}/powers`);
  redirect(`/campaigns/${campaignId}/powers/${power.id}`);
}

export async function updatePowerAction(
  campaignId: string,
  powerId: string,
  _prevState: PowerFormState,
  formData: FormData,
): Promise<PowerFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = powerFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  await db.power.update({ where: { id: powerId }, data: buildPowerData(parsed.data) });
  await syncPowerTags(powerId, tagIds);

  revalidatePath(`/campaigns/${campaignId}/powers`);
  revalidatePath(`/campaigns/${campaignId}/powers/${powerId}`);
  redirect(`/campaigns/${campaignId}/powers/${powerId}`);
}

export async function togglePowerFavoriteAction(campaignId: string, powerId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const power = await db.power.findFirst({ where: { id: powerId, campaignId }, select: { favorite: true } });
  if (!power) return;

  await db.power.update({ where: { id: powerId }, data: { favorite: !power.favorite } });
  revalidatePath(`/campaigns/${campaignId}/powers`);
  revalidatePath(`/campaigns/${campaignId}/powers/${powerId}`);
}

export async function togglePowerArchivedAction(campaignId: string, powerId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const power = await db.power.findFirst({ where: { id: powerId, campaignId }, select: { archived: true } });
  if (!power) return;

  await db.power.update({ where: { id: powerId }, data: { archived: !power.archived } });
  revalidatePath(`/campaigns/${campaignId}/powers`);
  revalidatePath(`/campaigns/${campaignId}/powers/${powerId}`);
}

export async function deletePowerAction(campaignId: string, powerId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.$transaction([
    db.relationship.deleteMany({ where: { campaignId, ...relationshipsInvolvingEntity("POWER", powerId) } }),
    db.power.delete({ where: { id: powerId } }),
  ]);

  revalidatePath(`/campaigns/${campaignId}/powers`);
  redirect(`/campaigns/${campaignId}/powers`);
}
