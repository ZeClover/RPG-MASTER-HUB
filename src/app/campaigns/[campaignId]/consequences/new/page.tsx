import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { createConsequenceAction } from "@/modules/preparation/consequences/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { ConsequenceForm } from "@/components/consequences/consequence-form";

export const metadata: Metadata = { title: "Nova consequência" };

interface NewConsequencePageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function NewConsequencePage({ params }: NewConsequencePageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const tags = await listTagsForCampaign(campaignId);
  const action = createConsequenceAction.bind(null, campaignId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Nova consequência</h1>
        <p className="text-sm text-muted-foreground">Só o título é obrigatório.</p>
      </div>
      <ConsequenceForm campaignId={campaignId} action={action} submitLabel="Criar consequência" availableTags={tags} />
    </div>
  );
}
