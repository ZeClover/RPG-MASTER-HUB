"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { combatantFormSchema, combatantUpdateSchema, type CombatantUpdateInput } from "@/modules/game/combat/schemas";

function revalidateSession(campaignId: string) {
  revalidatePath(`/campaigns/${campaignId}/session`);
}

export async function startEncounterAction(campaignId: string, name: string, sessionPlanId?: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const encounter = await db.combatEncounter.create({
    data: { campaignId, name: name.trim() || "Combate", sessionPlanId: sessionPlanId || null },
  });

  revalidateSession(campaignId);
  return encounter;
}

export async function endEncounterAction(campaignId: string, encounterId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.combatEncounter.update({ where: { id: encounterId }, data: { endedAt: new Date() } });
  revalidateSession(campaignId);
}

export async function addCombatantAction(
  campaignId: string,
  encounterId: string,
  input: { id: string; name: string; type: "PC" | "NPC"; initiative: number; hpMax?: number },
) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = combatantFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const last = await db.combatant.findFirst({ where: { encounterId }, orderBy: { order: "desc" }, select: { order: true } });

  // O id vem do cliente (gerado no otimista da UI), não do banco: o Modo
  // Sessão precisa atualizar HP/condições logo em seguida à criação, às
  // vezes antes de a escrita original ter sido confirmada pelo servidor
  // (ou enquanto ainda está na fila offline) — usar o mesmo id em ambos os
  // lados desde o início evita ter que reconciliar dois ids depois (mesmo
  // problema que `SessionLogEntry.clientId` resolve para o registro da sessão).
  await db.combatant.create({
    data: {
      id: parsed.data.id,
      encounterId,
      name: parsed.data.name,
      type: parsed.data.type,
      initiative: parsed.data.initiative,
      hpMax: parsed.data.hpMax ?? null,
      hpCurrent: parsed.data.hpMax ?? null,
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidateSession(campaignId);
}

export async function updateCombatantAction(campaignId: string, combatantId: string, input: CombatantUpdateInput) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const parsed = combatantUpdateSchema.safeParse(input);
  if (!parsed.success) return;

  const { conditions, ...rest } = parsed.data;
  await db.combatant.update({
    where: { id: combatantId },
    data: { ...rest, conditions: conditions === "" ? null : conditions },
  });

  revalidateSession(campaignId);
}

export async function removeCombatantAction(campaignId: string, combatantId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.combatant.delete({ where: { id: combatantId } });
  revalidateSession(campaignId);
}

export async function advanceTurnAction(campaignId: string, encounterId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const encounter = await db.combatEncounter.findUnique({
    where: { id: encounterId },
    include: { combatants: { orderBy: { initiative: "desc" } } },
  });
  if (!encounter || encounter.combatants.length === 0) return;

  const currentIndex = encounter.combatants.findIndex((c) => c.id === encounter.activeCombatantId);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % encounter.combatants.length;
  const wrapped = currentIndex !== -1 && nextIndex === 0;

  await db.combatEncounter.update({
    where: { id: encounterId },
    data: {
      activeCombatantId: encounter.combatants[nextIndex].id,
      round: wrapped ? encounter.round + 1 : encounter.round,
    },
  });

  revalidateSession(campaignId);
}
