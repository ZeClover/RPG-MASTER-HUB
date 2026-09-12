"use client";

import { useState, useTransition } from "react";
import { Pause, Play, Trash2, Volume2 } from "lucide-react";

import type { AudioTrack } from "@/generated/prisma/client";
import { deleteAudioTrackAction, playMusicAction, stopMusicAction, triggerSfxAction } from "@/modules/audio/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface TrackBoardProps {
  campaignId: string;
  musicTracks: AudioTrack[];
  sfxTracks: AudioTrack[];
  playbackState: { trackId: string | null; isPlaying: boolean } | null;
}

function DeleteTrackButton({ campaignId, track }: { campaignId: string; track: AudioTrack }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Trash2 className="size-4 text-destructive" />
        <span className="sr-only">Excluir faixa</span>
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Excluir "${track.name}"?`}
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={() => deleteAudioTrackAction(campaignId, track.id)}
      />
    </>
  );
}

function MusicTrackCard({ campaignId, track, isActive }: { campaignId: string; track: AudioTrack; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="flex items-center justify-between gap-3 p-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="truncate text-sm font-medium">{track.name}</span>
        {track.loop && <Badge variant="secondary">Loop</Badge>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {isActive ? (
          <Button
            size="icon"
            variant="secondary"
            disabled={isPending}
            onClick={() => startTransition(() => stopMusicAction(campaignId))}
          >
            <Pause className="size-4" />
            <span className="sr-only">Pausar</span>
          </Button>
        ) : (
          <Button
            size="icon"
            variant="secondary"
            disabled={isPending}
            onClick={() => startTransition(() => playMusicAction(campaignId, track.id))}
          >
            <Play className="size-4" />
            <span className="sr-only">Tocar</span>
          </Button>
        )}
        <DeleteTrackButton campaignId={campaignId} track={track} />
      </div>
    </Card>
  );
}

function SfxTrackCard({ campaignId, track }: { campaignId: string; track: AudioTrack }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="flex items-center justify-between gap-3 p-4">
      <span className="min-w-0 truncate text-sm font-medium">{track.name}</span>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={() => startTransition(() => triggerSfxAction(campaignId, track.id))}
        >
          <Volume2 className="size-4" /> {isPending ? "Tocando…" : "Tocar"}
        </Button>
        <DeleteTrackButton campaignId={campaignId} track={track} />
      </div>
    </Card>
  );
}

export function TrackBoard({ campaignId, musicTracks, sfxTracks, playbackState }: TrackBoardProps) {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Música</h2>
        {musicTracks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma faixa de música ainda.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {musicTracks.map((track) => (
              <MusicTrackCard
                key={track.id}
                campaignId={campaignId}
                track={track}
                isActive={Boolean(playbackState?.trackId === track.id && playbackState?.isPlaying)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Efeitos</h2>
        {sfxTracks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum efeito sonoro ainda.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sfxTracks.map((track) => (
              <SfxTrackCard key={track.id} campaignId={campaignId} track={track} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
