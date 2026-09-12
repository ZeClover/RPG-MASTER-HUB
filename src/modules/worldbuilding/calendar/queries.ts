import "server-only";

import { db } from "@/lib/db";
import { requireCampaignAccess } from "@/modules/core/permissions";

/**
 * `CampaignCalendar` é singleton por campanha (mesmo padrão de `DiscordLink`/
 * `MusicPlaybackState`, Fase 4) e só passa a existir no banco quando o mestre
 * mexe nele pela primeira vez (`upsert` nas actions). Enquanto isso, a
 * ausência de linha é lida como "dia 1" — não é um estado de erro.
 */
export async function getCampaignCalendar(userId: string, campaignId: string) {
  await requireCampaignAccess(userId, campaignId);
  return db.campaignCalendar.findUnique({ where: { campaignId } });
}
