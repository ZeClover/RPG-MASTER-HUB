import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess } from "@/modules/core/permissions";
import { getConsequenceForUser } from "@/modules/preparation/consequences/queries";
import {
  deleteConsequenceAction,
  toggleConsequenceArchivedAction,
  toggleConsequenceFavoriteAction,
} from "@/modules/preparation/consequences/actions";
import { listRelationshipsForEntity } from "@/modules/creation/relationships/queries";
import { Badge } from "@/components/ui/badge";
import { CONSEQUENCE_STATUS_LABELS, CONSEQUENCE_STATUS_BADGE_VARIANT } from "@/components/wiki/status-config";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";
import { RevealToPlayersButton } from "@/components/players/reveal-to-players-button";
import { TagBadgeList } from "@/components/wiki/tag-badge-list";
import { RelatedEntitiesPanel } from "@/components/wiki/related-entities-panel";
import { EntityActionsMenu } from "@/components/wiki/entity-actions-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConsequenceDetailPageProps {
  params: Promise<{ campaignId: string; consequenceId: string }>;
}

export async function generateMetadata({ params }: ConsequenceDetailPageProps): Promise<Metadata> {
  const { campaignId, consequenceId } = await params;
  const user = await requireUser();
  const consequence = await getConsequenceForUser(user.id, campaignId, consequenceId).catch(() => null);
  return { title: consequence?.title ?? "Consequência" };
}

export default async function ConsequenceDetailPage({ params }: ConsequenceDetailPageProps) {
  const { campaignId, consequenceId } = await params;
  const user = await requireUser();
  const consequence = await getConsequenceForUser(user.id, campaignId, consequenceId);
  if (!consequence) notFound();
  const { role } = await requireCampaignAccess(user.id, campaignId);
  const canManage = role !== "PLAYER";

  const relationships = await listRelationshipsForEntity(campaignId, "CONSEQUENCE", consequenceId, role);

  const fields: { label: string; value: string | null }[] = [
    { label: "Gatilho", value: consequence.trigger },
    { label: "Descrição", value: consequence.description },
  ];
  const filledFields = fields.filter((field) => field.value);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-elevated text-xl font-semibold">
            <ShieldAlert className="size-7 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{consequence.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant={CONSEQUENCE_STATUS_BADGE_VARIANT[consequence.status]}>
                {CONSEQUENCE_STATUS_LABELS[consequence.status]}
              </Badge>
              <VisibilityBadge visibility={consequence.visibility} />
              {canManage && consequence.visibility === "GM_ONLY" && (
                <RevealToPlayersButton campaignId={campaignId} entityType="CONSEQUENCE" entityId={consequenceId} />
              )}
            </div>
          </div>
        </div>

        {canManage && (
          <EntityActionsMenu
            editHref={`/campaigns/${campaignId}/consequences/${consequenceId}/edit`}
            favorite={consequence.favorite}
            archived={consequence.archived}
            onToggleFavorite={toggleConsequenceFavoriteAction.bind(null, campaignId, consequenceId)}
            onToggleArchived={toggleConsequenceArchivedAction.bind(null, campaignId, consequenceId)}
            onDelete={deleteConsequenceAction.bind(null, campaignId, consequenceId)}
            deleteTitle={`Excluir "${consequence.title}"?`}
            deleteDescription="Esta ação não pode ser desfeita. Relações com esta consequência também serão removidas."
          />
        )}
      </div>

      {consequence.tags.length > 0 && (
        <TagBadgeList
          tags={consequence.tags.map((entry) => entry.tag)}
          campaignId={campaignId}
          linkBasePath={`/campaigns/${campaignId}/consequences`}
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
        entityType="CONSEQUENCE"
        entityId={consequenceId}
        relationships={relationships}
      canManage={canManage}
      />
    </div>
  );
}
