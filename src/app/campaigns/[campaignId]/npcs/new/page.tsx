import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { createNpcAction } from "@/modules/creation/npcs/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { NpcForm } from "@/components/npcs/npc-form";

export const metadata: Metadata = { title: "Novo NPC" };

interface NewNpcPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function NewNpcPage({ params }: NewNpcPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const tags = await listTagsForCampaign(campaignId);
  const action = createNpcAction.bind(null, campaignId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Novo NPC</h1>
        <p className="text-sm text-muted-foreground">Só o nome é obrigatório — preencha o resto quando quiser.</p>
      </div>
      <NpcForm campaignId={campaignId} action={action} submitLabel="Criar NPC" availableTags={tags} />
    </div>
  );
}
