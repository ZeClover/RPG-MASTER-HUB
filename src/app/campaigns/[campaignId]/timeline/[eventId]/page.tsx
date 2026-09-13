import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { History } from "lucide-react";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess } from "@/modules/core/permissions";
import { getTimelineEventForUser } from "@/modules/worldbuilding/timeline/queries";
import {
  deleteTimelineEventAction,
  toggleTimelineEventArchivedAction,
  toggleTimelineEventFavoriteAction,
} from "@/modules/worldbuilding/timeline/actions";
import { listRelationshipsForEntity } from "@/modules/creation/relationships/queries";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";
import { RevealToPlayersButton } from "@/components/players/reveal-to-players-button";
import { TagBadgeList } from "@/components/wiki/tag-badge-list";
import { RelatedEntitiesPanel } from "@/components/wiki/related-entities-panel";
import { EntityActionsMenu } from "@/components/wiki/entity-actions-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TimelineEventDetailPageProps {
  params: Promise<{ campaignId: string; eventId: string }>;
}

export async function generateMetadata({ params }: TimelineEventDetailPageProps): Promise<Metadata> {
  const { campaignId, eventId } = await params;
  const user = await requireUser();
  const event = await getTimelineEventForUser(user.id, campaignId, eventId).catch(() => null);
  return { title: event?.title ?? "Evento" };
}

export default async function TimelineEventDetailPage({ params }: TimelineEventDetailPageProps) {
  const { campaignId, eventId } = await params;
  const user = await requireUser();
  const event = await getTimelineEventForUser(user.id, campaignId, eventId);
  if (!event) notFound();
  const { role } = await requireCampaignAccess(user.id, campaignId);
  const canManage = role !== "PLAYER";

  const relationships = await listRelationshipsForEntity(campaignId, "TIMELINE_EVENT", eventId, role);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-elevated text-xl font-semibold">
            <History className="size-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{event.title}</h1>
            {event.narrativeDate && <p className="text-sm font-medium text-primary">{event.narrativeDate}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <VisibilityBadge visibility={event.visibility} />
              {canManage && event.visibility === "GM_ONLY" && (
                <RevealToPlayersButton campaignId={campaignId} entityType="TIMELINE_EVENT" entityId={eventId} />
              )}
            </div>
          </div>
        </div>

        {canManage && (
          <EntityActionsMenu
            editHref={`/campaigns/${campaignId}/timeline/${eventId}/edit`}
            favorite={event.favorite}
            archived={event.archived}
            onToggleFavorite={toggleTimelineEventFavoriteAction.bind(null, campaignId, eventId)}
            onToggleArchived={toggleTimelineEventArchivedAction.bind(null, campaignId, eventId)}
            onDelete={deleteTimelineEventAction.bind(null, campaignId, eventId)}
            deleteTitle={`Excluir "${event.title}"?`}
            deleteDescription="Esta ação não pode ser desfeita. Relações com este evento também serão removidas."
          />
        )}
      </div>

      {event.tags.length > 0 && (
        <TagBadgeList
          tags={event.tags.map((entry) => entry.tag)}
          campaignId={campaignId}
          linkBasePath={`/campaigns/${campaignId}/timeline`}
        />
      )}

      {event.description ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Descrição</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap pt-0 text-sm">{event.description}</CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum detalhe preenchido ainda.</p>
      )}

      <RelatedEntitiesPanel
        campaignId={campaignId}
        entityType="TIMELINE_EVENT"
        entityId={eventId}
        relationships={relationships}
        canManage={canManage}
      />
    </div>
  );
}
