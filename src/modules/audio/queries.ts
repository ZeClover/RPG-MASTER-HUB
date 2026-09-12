import "server-only";

import { db } from "@/lib/db";
import type { AudioTrackCategory } from "@/generated/prisma/client";
import { requireCampaignAccess } from "@/modules/core/permissions";

export function listAudioTracks(campaignId: string, category?: AudioTrackCategory) {
  return db.audioTrack.findMany({
    where: { campaignId, category },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMusicPlaybackState(userId: string, campaignId: string) {
  await requireCampaignAccess(userId, campaignId);
  return db.musicPlaybackState.findUnique({ where: { campaignId }, include: { track: true } });
}

export async function getDiscordLink(userId: string, campaignId: string) {
  await requireCampaignAccess(userId, campaignId);
  return db.discordLink.findUnique({ where: { campaignId } });
}
