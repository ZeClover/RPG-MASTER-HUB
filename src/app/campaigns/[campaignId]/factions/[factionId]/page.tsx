import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess } from "@/modules/core/permissions";
import { getFactionForUser } from "@/modules/creation/factions/queries";
import {
  deleteFactionAction,
  toggleFactionArchivedAction,
  toggleFactionFavoriteAction,
} from "@/modules/creation/factions/actions";
import { listRelationshipsForEntity } from "@/modules/creation/relationships/queries";
import { CanonStatusBadge } from "@/components/wiki/canon-status-badge";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";
import { TagBadgeList } from "@/components/wiki/tag-badge-list";
import { RelatedEntitiesPanel } from "@/components/wiki/related-entities-panel";
import { EntityActionsMenu } from "@/components/wiki/entity-actions-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FactionDetailPageProps {
  params: Promise<{ campaignId: string; factionId: string }>;
}

export async function generateMetadata({ params }: FactionDetailPageProps): Promise<Metadata> {
  const { campaignId, factionId } = await params;
  const user = await requireUser();
  const faction = await getFactionForUser(user.id, campaignId, factionId).catch(() => null);
  return { title: faction?.name ?? "Facção" };
}

export default async function FactionDetailPage({ params }: FactionDetailPageProps) {
  const { campaignId, factionId } = await params;
  const user = await requireUser();
  const faction = await getFactionForUser(user.id, campaignId, factionId);
  if (!faction) notFound();
  const { role } = await requireCampaignAccess(user.id, campaignId);
  const canManage = role !== "PLAYER";

  const relationships = await listRelationshipsForEntity(campaignId, "FACTION", factionId, role);

  const fields: { label: string; value: string | null }[] = [
    { label: "Descrição", value: faction.description },
    { label: "História", value: faction.history },
    { label: "Objetivos", value: faction.goals },
    { label: "Recursos", value: faction.resources },
    { label: "Segredos", value: faction.secrets },
    { label: "Notas", value: faction.notes },
  ];
  const filledFields = fields.filter((field) => field.value);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-elevated text-xl font-semibold">
            {faction.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL dinâmica de storage
              <img src={faction.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              faction.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{faction.name}</h1>
            <p className="text-sm text-muted-foreground">{faction.factionType || "Sem tipo definido"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <CanonStatusBadge status={faction.canonStatus} />
              <VisibilityBadge visibility={faction.visibility} />
            </div>
          </div>
        </div>

        {canManage && (
          <EntityActionsMenu
            editHref={`/campaigns/${campaignId}/factions/${factionId}/edit`}
            favorite={faction.favorite}
            archived={faction.archived}
            onToggleFavorite={toggleFactionFavoriteAction.bind(null, campaignId, factionId)}
            onToggleArchived={toggleFactionArchivedAction.bind(null, campaignId, factionId)}
            onDelete={deleteFactionAction.bind(null, campaignId, factionId)}
            deleteTitle={`Excluir "${faction.name}"?`}
            deleteDescription="Esta ação não pode ser desfeita. Relações com esta facção também serão removidas."
          />
        )}
      </div>

      {faction.tags.length > 0 && (
        <TagBadgeList
          tags={faction.tags.map((entry) => entry.tag)}
          campaignId={campaignId}
          linkBasePath={`/campaigns/${campaignId}/factions`}
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
        entityType="FACTION"
        entityId={factionId}
        relationships={relationships}
        canManage={canManage}
      />
    </div>
  );
}
