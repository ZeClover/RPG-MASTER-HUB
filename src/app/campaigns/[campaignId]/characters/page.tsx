import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getEnabledModuleKeys } from "@/modules/core/campaigns/module-settings";
import { listCharacters } from "@/modules/players/characters/queries";
import { Button } from "@/components/ui/button";
import { CharacterList } from "@/components/characters/character-list";

export const metadata: Metadata = { title: "Personagens" };

interface CharactersPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function CharactersPage({ params }: CharactersPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId);
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  // Personagens vem ligado por padrão, mas continua sendo um módulo
  // alternável — proteção em profundidade contra acesso direto por URL
  // quando o mestre desliga (Fase 10, ver ARCHITECTURE.md, seção 21).
  const enabledModuleKeys = await getEnabledModuleKeys(campaignId);
  if (!enabledModuleKeys.has("characters")) notFound();

  const characters = await listCharacters(user.id, campaignId);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Personagens</h1>
          <p className="text-sm text-muted-foreground">Fichas simples dos personagens jogados nesta campanha.</p>
        </div>
        <Button asChild>
          <Link href={`/campaigns/${campaignId}/characters/new`}>
            <Plus className="size-4" /> Nova ficha
          </Link>
        </Button>
      </div>

      <CharacterList campaignId={campaignId} currentUserId={user.id} characters={characters} />
    </div>
  );
}
