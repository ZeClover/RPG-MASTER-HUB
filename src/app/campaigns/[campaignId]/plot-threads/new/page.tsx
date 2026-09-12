import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { createPlotThreadAction } from "@/modules/preparation/plot-threads/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { PlotThreadForm } from "@/components/plot-threads/plot-thread-form";

export const metadata: Metadata = { title: "Nova trama" };

interface NewPlotThreadPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function NewPlotThreadPage({ params }: NewPlotThreadPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const tags = await listTagsForCampaign(campaignId);
  const action = createPlotThreadAction.bind(null, campaignId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Nova trama</h1>
        <p className="text-sm text-muted-foreground">Só o título é obrigatório.</p>
      </div>
      <PlotThreadForm campaignId={campaignId} action={action} submitLabel="Criar trama" availableTags={tags} />
    </div>
  );
}
