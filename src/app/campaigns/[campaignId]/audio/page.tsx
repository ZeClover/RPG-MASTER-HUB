import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listAudioTracks, getMusicPlaybackState, getDiscordLink } from "@/modules/audio/queries";
import { AddTrackForm } from "@/components/audio/add-track-form";
import { TrackBoard } from "@/components/audio/track-board";
import { DiscordLinkForm } from "@/components/audio/discord-link-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Music/SFX Board" };

interface AudioPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function AudioPage({ params }: AudioPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId);
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const [musicTracks, sfxTracks, playbackState, discordLink] = await Promise.all([
    listAudioTracks(campaignId, "MUSIC"),
    listAudioTracks(campaignId, "SFX"),
    getMusicPlaybackState(user.id, campaignId),
    getDiscordLink(user.id, campaignId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="text-xl font-semibold">Music/SFX Board</h1>
        <p className="text-sm text-muted-foreground">
          Envie faixas de música e efeitos sonoros e acione os bots do Discord da campanha.
        </p>
      </div>

      <AddTrackForm campaignId={campaignId} />

      <TrackBoard
        campaignId={campaignId}
        musicTracks={musicTracks}
        sfxTracks={sfxTracks}
        playbackState={playbackState}
      />

      <Card>
        <CardHeader>
          <CardTitle>Configuração do Discord</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="mb-4 text-sm text-muted-foreground">
            Define em qual servidor e canal de voz os bots de música e de efeitos sonoros da campanha devem entrar.
          </p>
          <DiscordLinkForm campaignId={campaignId} discordLink={discordLink} />
        </CardContent>
      </Card>
    </div>
  );
}
