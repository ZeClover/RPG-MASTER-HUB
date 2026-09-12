import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { createMonsterAction } from "@/modules/gametools/monsters/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { MonsterForm } from "@/components/monsters/monster-form";

export const metadata: Metadata = { title: "Novo monstro" };

interface NewMonsterPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function NewMonsterPage({ params }: NewMonsterPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const tags = await listTagsForCampaign(campaignId);
  const action = createMonsterAction.bind(null, campaignId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Novo monstro</h1>
        <p className="text-sm text-muted-foreground">
          Só o nome é obrigatório. Atributos (HP, ataque, etc.) são adicionados depois de criar.
        </p>
      </div>
      <MonsterForm campaignId={campaignId} action={action} submitLabel="Criar monstro" availableTags={tags} />
    </div>
  );
}
