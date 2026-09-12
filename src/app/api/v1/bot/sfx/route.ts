import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { isAuthorizedBotRequest, resolveFileUrl } from "@/lib/bot-auth";

/**
 * Polled pelo bot de efeitos sonoros: devolve disparos ainda não processados
 * (`processedAt: null`), mais antigos primeiro. O bot toca cada um e chama
 * `/api/v1/bot/sfx/ack` para marcar como processado — sem isso, o mesmo
 * efeito tocaria de novo no próximo poll.
 */
export async function GET(request: Request) {
  if (!isAuthorizedBotRequest(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const origin = new URL(request.url).origin;

  const events = await db.sfxTriggerEvent.findMany({
    where: { processedAt: null },
    include: { track: true, campaign: { include: { discordLink: true } } },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  const items = events
    .filter((event) => event.campaign.discordLink)
    .map((event) => ({
      id: event.id,
      campaignId: event.campaignId,
      guildId: event.campaign.discordLink!.guildId,
      voiceChannelId: event.campaign.discordLink!.voiceChannelId,
      fileUrl: resolveFileUrl(origin, event.track.fileUrl),
    }));

  return NextResponse.json({ events: items });
}
