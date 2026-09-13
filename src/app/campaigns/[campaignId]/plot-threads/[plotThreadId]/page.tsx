import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Scroll } from "lucide-react";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess } from "@/modules/core/permissions";
import { getPlotThreadForUser } from "@/modules/preparation/plot-threads/queries";
import {
  deletePlotThreadAction,
  togglePlotThreadArchivedAction,
  togglePlotThreadFavoriteAction,
} from "@/modules/preparation/plot-threads/actions";
import { listRelationshipsForEntity } from "@/modules/creation/relationships/queries";
import { RELATIONSHIP_IMPORTANCE_LABELS } from "@/modules/creation/relationships/config";
import { PLOT_THREAD_STATUS_BADGE_VARIANT, PLOT_THREAD_STATUS_LABELS } from "@/components/wiki/status-config";
import { Badge } from "@/components/ui/badge";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";
import { RevealToPlayersButton } from "@/components/players/reveal-to-players-button";
import { TagBadgeList } from "@/components/wiki/tag-badge-list";
import { RelatedEntitiesPanel } from "@/components/wiki/related-entities-panel";
import { EntityActionsMenu } from "@/components/wiki/entity-actions-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlotThreadDetailPageProps {
  params: Promise<{ campaignId: string; plotThreadId: string }>;
}

export async function generateMetadata({ params }: PlotThreadDetailPageProps): Promise<Metadata> {
  const { campaignId, plotThreadId } = await params;
  const user = await requireUser();
  const plotThread = await getPlotThreadForUser(user.id, campaignId, plotThreadId).catch(() => null);
  return { title: plotThread?.title ?? "Trama" };
}

export default async function PlotThreadDetailPage({ params }: PlotThreadDetailPageProps) {
  const { campaignId, plotThreadId } = await params;
  const user = await requireUser();
  const plotThread = await getPlotThreadForUser(user.id, campaignId, plotThreadId);
  if (!plotThread) notFound();
  const { role } = await requireCampaignAccess(user.id, campaignId);
  const canManage = role !== "PLAYER";

  const relationships = await listRelationshipsForEntity(campaignId, "PLOT_THREAD", plotThreadId, role);

  const fields: { label: string; value: string | null }[] = [{ label: "Descrição", value: plotThread.description }];
  const filledFields = fields.filter((field) => field.value);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-elevated text-xl font-semibold">
            <Scroll className="size-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{plotThread.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant={PLOT_THREAD_STATUS_BADGE_VARIANT[plotThread.status]}>
                {PLOT_THREAD_STATUS_LABELS[plotThread.status]}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {RELATIONSHIP_IMPORTANCE_LABELS[plotThread.importance]}
              </span>
              <VisibilityBadge visibility={plotThread.visibility} />
              {canManage && plotThread.visibility === "GM_ONLY" && (
                <RevealToPlayersButton campaignId={campaignId} entityType="PLOT_THREAD" entityId={plotThreadId} />
              )}
            </div>
          </div>
        </div>

        {canManage && (
          <EntityActionsMenu
            editHref={`/campaigns/${campaignId}/plot-threads/${plotThreadId}/edit`}
            favorite={plotThread.favorite}
            archived={plotThread.archived}
            onToggleFavorite={togglePlotThreadFavoriteAction.bind(null, campaignId, plotThreadId)}
            onToggleArchived={togglePlotThreadArchivedAction.bind(null, campaignId, plotThreadId)}
            onDelete={deletePlotThreadAction.bind(null, campaignId, plotThreadId)}
            deleteTitle={`Excluir "${plotThread.title}"?`}
            deleteDescription="Esta ação não pode ser desfeita. Relações com esta trama também serão removidas."
          />
        )}
      </div>

      {plotThread.tags.length > 0 && (
        <TagBadgeList
          tags={plotThread.tags.map((entry) => entry.tag)}
          campaignId={campaignId}
          linkBasePath={`/campaigns/${campaignId}/plot-threads`}
        />
      )}

      <div className="flex flex-col gap-4">
        {filledFields.length > 0 ? (
          filledFields.map((field) => (
            <Card key={field.label}>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{field.label}</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap pt-0 text-sm">{field.value}</CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum detalhe preenchido ainda.</p>
        )}
      </div>

      <RelatedEntitiesPanel
        campaignId={campaignId}
        entityType="PLOT_THREAD"
        entityId={plotThreadId}
        relationships={relationships}
      canManage={canManage}
      />
    </div>
  );
}
