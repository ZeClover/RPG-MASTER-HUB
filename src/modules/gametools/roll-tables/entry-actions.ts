"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import type { RollTableKind } from "@/generated/prisma/client";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { rollTableEntryFormSchema } from "@/modules/gametools/roll-tables/schemas";

export type RollTableEntryFormState = { error?: string } | undefined;

const BASE_PATH: Record<RollTableKind, string> = { GENERIC: "tables", LOOT: "loot" };

function revalidateTable(campaignId: string, kind: RollTableKind, tableId: string) {
  revalidatePath(`/campaigns/${campaignId}/${BASE_PATH[kind]}/${tableId}`);
}

export async function addRollTableEntryAction(
  campaignId: string,
  kind: RollTableKind,
  tableId: string,
  _prevState: RollTableEntryFormState,
  formData: FormData,
): Promise<RollTableEntryFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = rollTableEntryFormSchema.safeParse({
    label: formData.get("label"),
    weight: formData.get("weight") || "1",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrada inválida." };
  }

  const last = await db.rollTableEntry.findFirst({
    where: { tableId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await db.rollTableEntry.create({
    data: { tableId, label: parsed.data.label, weight: parsed.data.weight, order: (last?.order ?? -1) + 1 },
  });

  revalidateTable(campaignId, kind, tableId);
}

export async function deleteRollTableEntryAction(
  campaignId: string,
  kind: RollTableKind,
  tableId: string,
  entryId: string,
) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  await db.rollTableEntry.deleteMany({ where: { id: entryId, tableId } });
  revalidateTable(campaignId, kind, tableId);
}
