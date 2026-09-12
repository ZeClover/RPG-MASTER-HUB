import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getConsequenceForUser } from "@/modules/preparation/consequences/queries";
import { updateConsequenceAction } from "@/modules/preparation/consequences/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { ConsequenceForm } from "@/components/consequences/consequence-form";

export const metadata: Metadata = { title: "Editar consequência" };

interface EditConsequencePageProps {
  params: Promise<{ campaignId: string; consequenceId: string }>;
}

export default async function EditConsequencePage({ params }: EditConsequencePageProps) {
  const { campaignId, consequenceId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const consequence = await getConsequenceForUser(user.id, campaignId, consequenceId);
  if (!consequence) notFound();

  const tags = await listTagsForCampaign(campaignId);
  const action = updateConsequenceAction.bind(null, campaignId, consequenceId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Editar {consequence.title}</h1>
      </div>
      <ConsequenceForm
        campaignId={campaignId}
        action={action}
        submitLabel="Salvar alterações"
        defaultValues={consequence}
        availableTags={tags}
        defaultSelectedTagIds={consequence.tags.map((entry) => entry.tagId)}
      />
    </div>
  );
}
