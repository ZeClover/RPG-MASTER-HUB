import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getFactionForUser } from "@/modules/creation/factions/queries";
import { updateFactionAction } from "@/modules/creation/factions/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { FactionForm } from "@/components/factions/faction-form";

export const metadata: Metadata = { title: "Editar facção" };

interface EditFactionPageProps {
  params: Promise<{ campaignId: string; factionId: string }>;
}

export default async function EditFactionPage({ params }: EditFactionPageProps) {
  const { campaignId, factionId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const faction = await getFactionForUser(user.id, campaignId, factionId);
  if (!faction) notFound();

  const tags = await listTagsForCampaign(campaignId);
  const action = updateFactionAction.bind(null, campaignId, factionId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Editar {faction.name}</h1>
      </div>
      <FactionForm
        campaignId={campaignId}
        action={action}
        submitLabel="Salvar alterações"
        defaultValues={faction}
        availableTags={tags}
        defaultSelectedTagIds={faction.tags.map((entry) => entry.tagId)}
      />
    </div>
  );
}
