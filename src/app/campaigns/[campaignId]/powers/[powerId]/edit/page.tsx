import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getPowerForUser } from "@/modules/gametools/powers/queries";
import { updatePowerAction } from "@/modules/gametools/powers/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { PowerForm } from "@/components/powers/power-form";

export const metadata: Metadata = { title: "Editar poder" };

interface EditPowerPageProps {
  params: Promise<{ campaignId: string; powerId: string }>;
}

export default async function EditPowerPage({ params }: EditPowerPageProps) {
  const { campaignId, powerId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const power = await getPowerForUser(user.id, campaignId, powerId);
  if (!power) notFound();

  const tags = await listTagsForCampaign(campaignId);
  const action = updatePowerAction.bind(null, campaignId, powerId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Editar {power.name}</h1>
      </div>
      <PowerForm
        campaignId={campaignId}
        action={action}
        submitLabel="Salvar alterações"
        defaultValues={power}
        availableTags={tags}
        defaultSelectedTagIds={power.tags.map((entry) => entry.tagId)}
      />
    </div>
  );
}
