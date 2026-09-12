import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getPlotThreadForUser } from "@/modules/preparation/plot-threads/queries";
import { updatePlotThreadAction } from "@/modules/preparation/plot-threads/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { PlotThreadForm } from "@/components/plot-threads/plot-thread-form";

export const metadata: Metadata = { title: "Editar trama" };

interface EditPlotThreadPageProps {
  params: Promise<{ campaignId: string; plotThreadId: string }>;
}

export default async function EditPlotThreadPage({ params }: EditPlotThreadPageProps) {
  const { campaignId, plotThreadId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const plotThread = await getPlotThreadForUser(user.id, campaignId, plotThreadId);
  if (!plotThread) notFound();

  const tags = await listTagsForCampaign(campaignId);
  const action = updatePlotThreadAction.bind(null, campaignId, plotThreadId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Editar {plotThread.title}</h1>
      </div>
      <PlotThreadForm
        campaignId={campaignId}
        action={action}
        submitLabel="Salvar alterações"
        defaultValues={plotThread}
        availableTags={tags}
        defaultSelectedTagIds={plotThread.tags.map((entry) => entry.tagId)}
      />
    </div>
  );
}
