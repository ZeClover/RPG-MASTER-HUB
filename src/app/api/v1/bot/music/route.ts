import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { isAuthorizedBotRequest, resolveFileUrl } from "@/lib/bot-auth";

/**
 * Polled pelo bot de trilha sonora: para cada campanha com música tocando E
 * um canal de voz configurado, devolve onde entrar e o que tocar. O bot
 * decide sozinho, comparando com seu próprio estado de conexão, se precisa
 * entrar/trocar de faixa/sair — este endpoint só descreve o estado desejado,
 * nunca comanda a ação diretamente.
 */
export async function GET(request: Request) {
  if (!isAuthorizedBotRequest(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const origin = new URL(request.url).origin;

  const states = await db.musicPlaybackState.findMany({
    where: { isPlaying: true, trackId: { not: null } },
    include: { track: true, campaign: { include: { discordLink: true } } },
  });

  const campaigns = states
    .filter((state) => state.campaign.discordLink && state.track)
    .map((state) => ({
      campaignId: state.campaignId,
      guildId: state.campaign.discordLink!.guildId,
      voiceChannelId: state.campaign.discordLink!.voiceChannelId,
      trackId: state.track!.id,
      fileUrl: resolveFileUrl(origin, state.track!.fileUrl),
      loop: state.track!.loop,
    }));

  return NextResponse.json({ campaigns });
}
