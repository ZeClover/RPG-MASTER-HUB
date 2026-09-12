"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { relationshipsInvolvingEntity } from "@/modules/creation/relationships/queries";
import { monsterFormSchema, type MonsterFormInput } from "@/modules/gametools/monsters/schemas";

export type MonsterFormState =
  | {
      errors?: Partial<Record<keyof MonsterFormInput, string[]>>;
      message?: string;
    }
  | undefined;

function rawEntries(formData: FormData) {
  return {
    name: formData.get("name"),
    imageUrl: formData.get("imageUrl"),
    // Checkbox desmarcado manda `formData.get` retornar `null`, não `undefined` — `z.string().optional()`
    // só aceita o segundo (ver ARCHITECTURE.md, seção 18.5, bug pré-existente descoberto na Fase 7).
    isBoss: formData.get("isBoss") || undefined,
    description: formData.get("description"),
    canonStatus: formData.get("canonStatus"),
    visibility: formData.get("visibility"),
  };
}

function n(value: string | undefined) {
  return value ? value : null;
}

function buildMonsterData(data: MonsterFormInput) {
  return {
    name: data.name,
    imageUrl: n(data.imageUrl),
    isBoss: data.isBoss === "on",
    description: n(data.description),
    canonStatus: data.canonStatus,
    visibility: data.visibility,
  };
}

async function syncMonsterTags(monsterId: string, tagIds: string[]) {
  await db.monsterTag.deleteMany({ where: { monsterId, tagId: { notIn: tagIds } } });
  if (tagIds.length > 0) {
    await db.monsterTag.createMany({ data: tagIds.map((tagId) => ({ monsterId, tagId })), skipDuplicates: true });
  }
}

export async function createMonsterAction(
  campaignId: string,
  _prevState: MonsterFormState,
  formData: FormData,
): Promise<MonsterFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = monsterFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  const monster = await db.monster.create({
    data: {
      ...buildMonsterData(parsed.data),
      campaignId,
      tags: tagIds.length > 0 ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
  });

  revalidatePath(`/campaigns/${campaignId}/monsters`);
  redirect(`/campaigns/${campaignId}/monsters/${monster.id}`);
}

export async function updateMonsterAction(
  campaignId: string,
  monsterId: string,
  _prevState: MonsterFormState,
  formData: FormData,
): Promise<MonsterFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = monsterFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  await db.monster.update({ where: { id: monsterId }, data: buildMonsterData(parsed.data) });
  await syncMonsterTags(monsterId, tagIds);

  revalidatePath(`/campaigns/${campaignId}/monsters`);
  revalidatePath(`/campaigns/${campaignId}/monsters/${monsterId}`);
  redirect(`/campaigns/${campaignId}/monsters/${monsterId}`);
}

export async function toggleMonsterFavoriteAction(campaignId: string, monsterId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const monster = await db.monster.findFirst({ where: { id: monsterId, campaignId }, select: { favorite: true } });
  if (!monster) return;

  await db.monster.update({ where: { id: monsterId }, data: { favorite: !monster.favorite } });
  revalidatePath(`/campaigns/${campaignId}/monsters`);
  revalidatePath(`/campaigns/${campaignId}/monsters/${monsterId}`);
}

export async function toggleMonsterArchivedAction(campaignId: string, monsterId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const monster = await db.monster.findFirst({ where: { id: monsterId, campaignId }, select: { archived: true } });
  if (!monster) return;

  await db.monster.update({ where: { id: monsterId }, data: { archived: !monster.archived } });
  revalidatePath(`/campaigns/${campaignId}/monsters`);
  revalidatePath(`/campaigns/${campaignId}/monsters/${monsterId}`);
}

export async function deleteMonsterAction(campaignId: string, monsterId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.$transaction([
    db.relationship.deleteMany({ where: { campaignId, ...relationshipsInvolvingEntity("MONSTER", monsterId) } }),
    db.monster.delete({ where: { id: monsterId } }),
  ]);

  revalidatePath(`/campaigns/${campaignId}/monsters`);
  redirect(`/campaigns/${campaignId}/monsters`);
}
