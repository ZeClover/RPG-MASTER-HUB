import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getTimelineEventForUser } from "@/modules/worldbuilding/timeline/queries";
import { updateTimelineEventAction } from "@/modules/worldbuilding/timeline/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { TimelineEventForm } from "@/components/timeline/timeline-event-form";

export const metadata: Metadata = { title: "Editar evento" };

interface EditTimelineEventPageProps {
  params: Promise<{ campaignId: string; eventId: string }>;
}

export default async function EditTimelineEventPage({ params }: EditTimelineEventPageProps) {
  const { campaignId, eventId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const event = await getTimelineEventForUser(user.id, campaignId, eventId);
  if (!event) notFound();

  const tags = await listTagsForCampaign(campaignId);
  const action = updateTimelineEventAction.bind(null, campaignId, eventId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Editar {event.title}</h1>
      </div>
      <TimelineEventForm
        campaignId={campaignId}
        action={action}
        submitLabel="Salvar alterações"
        defaultValues={event}
        availableTags={tags}
        defaultSelectedTagIds={event.tags.map((entry) => entry.tagId)}
      />
    </div>
  );
}
