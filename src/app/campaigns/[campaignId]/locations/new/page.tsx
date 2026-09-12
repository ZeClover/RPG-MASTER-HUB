import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { createLocationAction } from "@/modules/creation/locations/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { LocationForm } from "@/components/locations/location-form";

export const metadata: Metadata = { title: "Novo local" };

interface NewLocationPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function NewLocationPage({ params }: NewLocationPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const tags = await listTagsForCampaign(campaignId);
  const action = createLocationAction.bind(null, campaignId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Novo local</h1>
        <p className="text-sm text-muted-foreground">Só o nome é obrigatório.</p>
      </div>
      <LocationForm campaignId={campaignId} action={action} submitLabel="Criar local" availableTags={tags} />
    </div>
  );
}
