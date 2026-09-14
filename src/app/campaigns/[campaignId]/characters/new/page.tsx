import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getEnabledModuleKeys } from "@/modules/core/campaigns/module-settings";
import { listCampaignMembers } from "@/modules/players/members/queries";
import { createCharacterAction } from "@/modules/players/characters/actions";
import { CharacterForm } from "@/components/characters/character-form";

export const metadata: Metadata = { title: "Nova ficha" };

interface NewCharacterPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function NewCharacterPage({ params }: NewCharacterPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  let role;
  try {
    ({ role } = await requireCampaignAccess(user.id, campaignId, "PLAYER"));
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const enabledModuleKeys = await getEnabledModuleKeys(campaignId);
  if (!enabledModuleKeys.has("characters")) notFound();

  const isGm = role === "CO_GM" || role === "OWNER";
  const assignableMembers = isGm
    ? (await listCampaignMembers(campaignId)).map((member) => ({
        id: member.user.id,
        label: member.user.name ?? member.user.email,
      }))
    : undefined;

  const action = createCharacterAction.bind(null, campaignId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Nova ficha</h1>
        <p className="text-sm text-muted-foreground">Só o nome é obrigatório — preencha o resto quando quiser.</p>
      </div>
      <CharacterForm
        campaignId={campaignId}
        action={action}
        submitLabel="Criar ficha"
        canEditGmNotes={isGm}
        assignableMembers={assignableMembers}
      />
    </div>
  );
}
