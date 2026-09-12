"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess } from "@/modules/core/permissions";
import { logEntryFormSchema } from "@/modules/game/session-log/schemas";

export interface LogEntryInput {
  type: "NOTE" | "DICE_ROLL" | "COMBAT_EVENT";
  content: string;
  clientId?: string;
  sessionPlanId?: string;
}

/**
 * `clientId` é gerado no navegador (não pelo banco) para permitir reenvio
 * idempotente: se a entrada já foi criada antes de a conexão cair, o
 * `@@unique([campaignId, clientId])` faz o segundo envio ser um upsert
 * sem duplicar — essencial para a fila de escrita offline (ver
 * ARCHITECTURE.md, "Modo Sessão offline").
 */
export async function createLogEntryAction(campaignId: string, input: LogEntryInput) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = logEntryFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrada inválida." };
  }

  const { type, content, clientId, sessionPlanId } = parsed.data;

  if (clientId) {
    await db.sessionLogEntry.upsert({
      where: { campaignId_clientId: { campaignId, clientId } },
      update: {},
      create: { campaignId, sessionPlanId: sessionPlanId || null, type, content, clientId },
    });
  } else {
    await db.sessionLogEntry.create({
      data: { campaignId, sessionPlanId: sessionPlanId || null, type, content },
    });
  }

  revalidatePath(`/campaigns/${campaignId}/session`);
}

export async function deleteLogEntryAction(campaignId: string, entryId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.sessionLogEntry.deleteMany({ where: { id: entryId, campaignId } });
  revalidatePath(`/campaigns/${campaignId}/session`);
}
