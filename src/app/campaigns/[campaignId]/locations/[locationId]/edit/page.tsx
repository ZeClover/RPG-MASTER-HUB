import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getLocationForUser } from "@/modules/creation/locations/queries";
import { updateLocationAction } from "@/modules/creation/locations/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { LocationForm } from "@/components/locations/location-form";

export const metadata: Metadata = { title: "Editar local" };

interface EditLocationPageProps {
  params: Promise<{ campaignId: string; locationId: string }>;
}

export default async function EditLocationPage({ params }: EditLocationPageProps) {
  const { campaignId, locationId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const location = await getLocationForUser(user.id, campaignId, locationId);
  if (!location) notFound();

  const tags = await listTagsForCampaign(campaignId);
  const action = updateLocationAction.bind(null, campaignId, locationId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Editar {location.name}</h1>
      </div>
      <LocationForm
        campaignId={campaignId}
        currentLocationId={locationId}
        action={action}
        submitLabel="Salvar alterações"
        defaultValues={location}
        availableTags={tags}
        defaultSelectedTagIds={location.tags.map((entry) => entry.tagId)}
      />
    </div>
  );
}
