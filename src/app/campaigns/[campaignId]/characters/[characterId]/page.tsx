import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getEnabledModuleKeys } from "@/modules/core/campaigns/module-settings";
import { getCharacterForUser } from "@/modules/players/characters/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteCharacterButton } from "@/components/characters/delete-character-button";

interface CharacterDetailPageProps {
  params: Promise<{ campaignId: string; characterId: string }>;
}

export async function generateMetadata({ params }: CharacterDetailPageProps): Promise<Metadata> {
  const { campaignId, characterId } = await params;
  const user = await requireUser();
  const character = await getCharacterForUser(user.id, campaignId, characterId).catch(() => null);
  return { title: character?.name ?? "Personagem" };
}

export default async function CharacterDetailPage({ params }: CharacterDetailPageProps) {
  const { campaignId, characterId } = await params;
  const user = await requireUser();

  let role;
  try {
    ({ role } = await requireCampaignAccess(user.id, campaignId));
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const enabledModuleKeys = await getEnabledModuleKeys(campaignId);
  if (!enabledModuleKeys.has("characters")) notFound();

  const character = await getCharacterForUser(user.id, campaignId, characterId);
  if (!character) notFound();

  const isGm = role === "CO_GM" || role === "OWNER";
  const canManage = isGm || character.playerId === user.id;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-elevated text-xl font-semibold">
            {character.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL dinâmica de storage
              <img src={character.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              character.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{character.name}</h1>
            {character.concept && <p className="text-sm text-muted-foreground">{character.concept}</p>}
            <p className="mt-1 text-xs text-muted-foreground">
              Jogado por {character.player.name ?? character.player.email}
            </p>
          </div>
        </div>

        {canManage && (
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/campaigns/${campaignId}/characters/${characterId}/edit`}>
                <Pencil className="size-4" /> Editar
              </Link>
            </Button>
            <DeleteCharacterButton campaignId={campaignId} characterId={characterId} characterName={character.name} />
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Biografia</CardTitle>
        </CardHeader>
        <CardContent className="whitespace-pre-wrap pt-0 text-sm">
          {character.bio || "Nenhum detalhe preenchido ainda."}
        </CardContent>
      </Card>

      {isGm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Notas do Mestre</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap pt-0 text-sm">
            {character.gmNotes || "Nenhuma nota ainda."}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
