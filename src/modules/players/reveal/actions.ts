"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import type { RelatableEntityType } from "@/generated/prisma/client";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getEntityHref } from "@/modules/creation/relationships/config";

/**
 * Player Knowledge (Fase 9, ver ARCHITECTURE.md, seção 21.3): reaproveita o
 * campo `visibility` que já existe nos 12 tipos de `RelatableEntityType`, em
 * vez de um sistema novo de "o que os jogadores sabem" — "revelar" é só
 * mudar `GM_ONLY` para `PLAYERS` em tempo real, pensado para o meio da
 * sessão ("acabei de mostrar este NPC ao grupo"), sem abrir o formulário
 * completo de edição da entidade. Um despachante fino, mesmo espírito do
 * Content Graveyard (Fase 7, seção 18.4) — nenhuma lógica de negócio nova,
 * só um `updateMany` condicionado a `visibility: "GM_ONLY"` (idempotente:
 * chamar de novo numa entidade já revelada não faz nada) por tipo.
 */
export async function revealToPlayersAction(campaignId: string, type: RelatableEntityType, id: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const where = { id, campaignId, visibility: "GM_ONLY" as const };
  const data = { visibility: "PLAYERS" as const };

  switch (type) {
    case "NPC":
      await db.npc.updateMany({ where, data });
      break;
    case "LOCATION":
      await db.location.updateMany({ where, data });
      break;
    case "FACTION":
      await db.faction.updateMany({ where, data });
      break;
    case "LORE_PAGE":
      await db.lorePage.updateMany({ where, data });
      break;
    case "QUEST":
      await db.quest.updateMany({ where, data });
      break;
    case "PLOT_THREAD":
      await db.plotThread.updateMany({ where, data });
      break;
    case "CONSEQUENCE":
      await db.consequence.updateMany({ where, data });
      break;
    case "TIMELINE_EVENT":
      await db.timelineEvent.updateMany({ where, data });
      break;
    case "MYSTERY":
      await db.mystery.updateMany({ where, data });
      break;
    case "MONSTER":
      await db.monster.updateMany({ where, data });
      break;
    case "ITEM":
      await db.item.updateMany({ where, data });
      break;
    case "POWER":
      await db.power.updateMany({ where, data });
      break;
  }

  revalidatePath(getEntityHref(campaignId, type, id));
}
