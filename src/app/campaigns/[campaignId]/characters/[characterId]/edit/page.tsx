import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getEnabledModuleKeys } from "@/modules/core/campaigns/module-settings";
import { getCharacterForUser } from "@/modules/players/characters/queries";
import { updateCharacterAction } from "@/modules/players/characters/actions";
import { CharacterForm } from "@/components/characters/character-form";

export const metadata: Metadata = { title: "Editar ficha" };

interface EditCharacterPageProps {
  params: Promise<{ campaignId: string; characterId: string }>;
}

export default async function EditCharacterPage({ params }: EditCharacterPageProps) {
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
  // Só a dona da ficha ou CO_GM/OWNER chegam até aqui — qualquer outro membro
  // da campanha recebe 404, não uma tela de "acesso negado" que revelaria a
  // existência da ficha (mesmo raciocínio de `entityForRole`, ARCHITECTURE.md
  // seção 21.2).
  if (!isGm && character.playerId !== user.id) notFound();

  const action = updateCharacterAction.bind(null, campaignId, characterId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Editar {character.name}</h1>
      </div>
      <CharacterForm
        campaignId={campaignId}
        action={action}
        submitLabel="Salvar alterações"
        defaultValues={character}
        canEditGmNotes={isGm}
      />
    </div>
  );
}
