"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { monsterAttributeFormSchema } from "@/modules/gametools/monsters/schemas";

export type MonsterAttributeFormState = { error?: string } | undefined;

function revalidateMonster(campaignId: string, monsterId: string) {
  revalidatePath(`/campaigns/${campaignId}/monsters/${monsterId}`);
}

/**
 * Só adicionar/remover — sem edição in-place, mesmo corte da Fase 5 para
 * `Clue` (ver ARCHITECTURE.md, seção 17.1): trocar um atributo errado é
 * excluir e adicionar de novo, sem justificar um formulário de edição extra.
 */
export async function addMonsterAttributeAction(
  campaignId: string,
  monsterId: string,
  _prevState: MonsterAttributeFormState,
  formData: FormData,
): Promise<MonsterAttributeFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = monsterAttributeFormSchema.safeParse({
    key: formData.get("key"),
    value: formData.get("value"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Atributo inválido." };
  }

  const last = await db.monsterAttribute.findFirst({
    where: { monsterId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await db.monsterAttribute.create({
    data: { monsterId, key: parsed.data.key, value: parsed.data.value, order: (last?.order ?? -1) + 1 },
  });

  revalidateMonster(campaignId, monsterId);
}

export async function deleteMonsterAttributeAction(campaignId: string, monsterId: string, attributeId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  await db.monsterAttribute.deleteMany({ where: { id: attributeId, monsterId } });
  revalidateMonster(campaignId, monsterId);
}
