import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";

import { requireUser } from "@/modules/core/auth/session";
import { getPowerForUser } from "@/modules/gametools/powers/queries";
import {
  deletePowerAction,
  togglePowerArchivedAction,
  togglePowerFavoriteAction,
} from "@/modules/gametools/powers/actions";
import { listRelationshipsForEntity } from "@/modules/creation/relationships/queries";
import { CanonStatusBadge } from "@/components/wiki/canon-status-badge";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";
import { TagBadgeList } from "@/components/wiki/tag-badge-list";
import { RelatedEntitiesPanel } from "@/components/wiki/related-entities-panel";
import { EntityActionsMenu } from "@/components/wiki/entity-actions-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PowerDetailPageProps {
  params: Promise<{ campaignId: string; powerId: string }>;
}

export async function generateMetadata({ params }: PowerDetailPageProps): Promise<Metadata> {
  const { campaignId, powerId } = await params;
  const user = await requireUser();
  const power = await getPowerForUser(user.id, campaignId, powerId).catch(() => null);
  return { title: power?.name ?? "Poder" };
}

export default async function PowerDetailPage({ params }: PowerDetailPageProps) {
  const { campaignId, powerId } = await params;
  const user = await requireUser();
  const power = await getPowerForUser(user.id, campaignId, powerId);
  if (!power) notFound();

  const relationships = await listRelationshipsForEntity(campaignId, "POWER", powerId);

  const fields: { label: string; value: string | null }[] = [
    { label: "Descrição", value: power.description },
    { label: "Efeito", value: power.effect },
  ];
  const filledFields = fields.filter((field) => field.value);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-elevated text-xl font-semibold">
            <Sparkles className="size-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{power.name}</h1>
            <p className="text-sm text-muted-foreground">{power.cost || "Sem custo definido"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <CanonStatusBadge status={power.canonStatus} />
              <VisibilityBadge visibility={power.visibility} />
            </div>
          </div>
        </div>

        <EntityActionsMenu
          editHref={`/campaigns/${campaignId}/powers/${powerId}/edit`}
          favorite={power.favorite}
          archived={power.archived}
          onToggleFavorite={togglePowerFavoriteAction.bind(null, campaignId, powerId)}
          onToggleArchived={togglePowerArchivedAction.bind(null, campaignId, powerId)}
          onDelete={deletePowerAction.bind(null, campaignId, powerId)}
          deleteTitle={`Excluir "${power.name}"?`}
          deleteDescription="Esta ação não pode ser desfeita. Relações com este poder também serão removidas."
        />
      </div>

      {power.tags.length > 0 && (
        <TagBadgeList
          tags={power.tags.map((entry) => entry.tag)}
          campaignId={campaignId}
          linkBasePath={`/campaigns/${campaignId}/powers`}
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
        entityType="POWER"
        entityId={powerId}
        relationships={relationships}
      />
    </div>
  );
}
