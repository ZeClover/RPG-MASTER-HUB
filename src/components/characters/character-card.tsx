import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CharacterCardProps {
  campaignId: string;
  character: {
    id: string;
    name: string;
    concept: string | null;
    imageUrl: string | null;
    player: { id: string; name: string | null; email: string };
  };
  currentUserId: string;
}

export function CharacterCard({ campaignId, character, currentUserId }: CharacterCardProps) {
  const isOwn = character.player.id === currentUserId;

  return (
    <Card className="relative flex flex-col gap-3 p-4">
      <Link
        href={`/campaigns/${campaignId}/characters/${character.id}`}
        className="absolute inset-0"
        aria-label={`Abrir ficha de ${character.name}`}
      />

      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-elevated text-base font-semibold">
          {character.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- upload local ou Vercel Blob, sem domínio fixo para next/image
            <img src={character.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            character.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{character.name}</h3>
          {character.concept && <p className="truncate text-xs text-muted-foreground">{character.concept}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs text-muted-foreground">
          {character.player.name ?? character.player.email}
        </span>
        {isOwn && <Badge variant="secondary">Sua ficha</Badge>}
      </div>
    </Card>
  );
}
