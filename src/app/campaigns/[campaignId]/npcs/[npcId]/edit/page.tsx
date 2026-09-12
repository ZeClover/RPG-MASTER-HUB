import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getNpcForUser } from "@/modules/creation/npcs/queries";
import { updateNpcAction } from "@/modules/creation/npcs/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { NpcForm } from "@/components/npcs/npc-form";

export const metadata: Metadata = { title: "Editar NPC" };

interface EditNpcPageProps {
  params: Promise<{ campaignId: string; npcId: string }>;
}

export default async function EditNpcPage({ params }: EditNpcPageProps) {
  const { campaignId, npcId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const npc = await getNpcForUser(user.id, campaignId, npcId);
  if (!npc) notFound();

  const tags = await listTagsForCampaign(campaignId);
  const action = updateNpcAction.bind(null, campaignId, npcId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Editar {npc.name}</h1>
      </div>
      <NpcForm
        campaignId={campaignId}
        action={action}
        submitLabel="Salvar alterações"
        defaultValues={npc}
        availableTags={tags}
        defaultSelectedTagIds={npc.tags.map((entry) => entry.tagId)}
      />
    </div>
  );
}
