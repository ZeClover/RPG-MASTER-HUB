"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import type { RollTableKind } from "@/generated/prisma/client";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { rollTableFormSchema, type RollTableFormInput } from "@/modules/gametools/roll-tables/schemas";

export type RollTableFormState =
  | {
      errors?: Partial<Record<keyof RollTableFormInput, string[]>>;
      message?: string;
    }
  | undefined;

/** "tables" para Table Builder, "loot" para Loot Generator — mesma entidade, rota diferente por `kind`. */
const BASE_PATH: Record<RollTableKind, string> = { GENERIC: "tables", LOOT: "loot" };

function n(value: string | undefined) {
  return value ? value : null;
}

export async function createRollTableAction(
  campaignId: string,
  kind: RollTableKind,
  _prevState: RollTableFormState,
  formData: FormData,
): Promise<RollTableFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = rollTableFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const table = await db.rollTable.create({
    data: { campaignId, kind, name: parsed.data.name, description: n(parsed.data.description) },
  });

  const base = BASE_PATH[kind];
  revalidatePath(`/campaigns/${campaignId}/${base}`);
  redirect(`/campaigns/${campaignId}/${base}/${table.id}`);
}

export async function updateRollTableAction(
  campaignId: string,
  kind: RollTableKind,
  tableId: string,
  _prevState: RollTableFormState,
  formData: FormData,
): Promise<RollTableFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = rollTableFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.rollTable.update({
    where: { id: tableId },
    data: { name: parsed.data.name, description: n(parsed.data.description) },
  });

  const base = BASE_PATH[kind];
  revalidatePath(`/campaigns/${campaignId}/${base}`);
  revalidatePath(`/campaigns/${campaignId}/${base}/${tableId}`);
  redirect(`/campaigns/${campaignId}/${base}/${tableId}`);
}

export async function toggleRollTableFavoriteAction(campaignId: string, kind: RollTableKind, tableId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const table = await db.rollTable.findFirst({ where: { id: tableId, campaignId }, select: { favorite: true } });
  if (!table) return;

  await db.rollTable.update({ where: { id: tableId }, data: { favorite: !table.favorite } });
  const base = BASE_PATH[kind];
  revalidatePath(`/campaigns/${campaignId}/${base}`);
  revalidatePath(`/campaigns/${campaignId}/${base}/${tableId}`);
}

export async function toggleRollTableArchivedAction(campaignId: string, kind: RollTableKind, tableId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const table = await db.rollTable.findFirst({ where: { id: tableId, campaignId }, select: { archived: true } });
  if (!table) return;

  await db.rollTable.update({ where: { id: tableId }, data: { archived: !table.archived } });
  const base = BASE_PATH[kind];
  revalidatePath(`/campaigns/${campaignId}/${base}`);
  revalidatePath(`/campaigns/${campaignId}/${base}/${tableId}`);
}

export async function deleteRollTableAction(campaignId: string, kind: RollTableKind, tableId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  // Sem Relationship para limpar: RollTable não participa do sistema polimórfico (ver ARCHITECTURE.md, seção 17.3).
  await db.rollTable.delete({ where: { id: tableId } });

  const base = BASE_PATH[kind];
  revalidatePath(`/campaigns/${campaignId}/${base}`);
  redirect(`/campaigns/${campaignId}/${base}`);
}
