import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { createTimelineEventAction } from "@/modules/worldbuilding/timeline/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { TimelineEventForm } from "@/components/timeline/timeline-event-form";

export const metadata: Metadata = { title: "Novo evento" };

interface NewTimelineEventPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function NewTimelineEventPage({ params }: NewTimelineEventPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const tags = await listTagsForCampaign(campaignId);
  const action = createTimelineEventAction.bind(null, campaignId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Novo evento</h1>
        <p className="text-sm text-muted-foreground">Só o título é obrigatório.</p>
      </div>
      <TimelineEventForm campaignId={campaignId} action={action} submitLabel="Criar evento" availableTags={tags} />
    </div>
  );
}
