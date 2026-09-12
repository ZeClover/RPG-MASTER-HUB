import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { getMonsterForUser } from "@/modules/gametools/monsters/queries";
import {
  deleteMonsterAction,
  toggleMonsterArchivedAction,
  toggleMonsterFavoriteAction,
} from "@/modules/gametools/monsters/actions";
import { listRelationshipsForEntity } from "@/modules/creation/relationships/queries";
import { Badge } from "@/components/ui/badge";
import { CanonStatusBadge } from "@/components/wiki/canon-status-badge";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";
import { TagBadgeList } from "@/components/wiki/tag-badge-list";
import { RelatedEntitiesPanel } from "@/components/wiki/related-entities-panel";
import { EntityActionsMenu } from "@/components/wiki/entity-actions-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonsterAttributeList } from "@/components/monsters/monster-attribute-list";

interface MonsterDetailPageProps {
  params: Promise<{ campaignId: string; monsterId: string }>;
}

export async function generateMetadata({ params }: MonsterDetailPageProps): Promise<Metadata> {
  const { campaignId, monsterId } = await params;
  const user = await requireUser();
  const monster = await getMonsterForUser(user.id, campaignId, monsterId).catch(() => null);
  return { title: monster?.name ?? "Monstro" };
}

export default async function MonsterDetailPage({ params }: MonsterDetailPageProps) {
  const { campaignId, monsterId } = await params;
  const user = await requireUser();
  const monster = await getMonsterForUser(user.id, campaignId, monsterId);
  if (!monster) notFound();

  const relationships = await listRelationshipsForEntity(campaignId, "MONSTER", monsterId);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-elevated text-xl font-semibold">
            {monster.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL dinâmica de storage
              <img src={monster.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              monster.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{monster.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {monster.isBoss && <Badge variant="destructive">Chefe</Badge>}
              <CanonStatusBadge status={monster.canonStatus} />
              <VisibilityBadge visibility={monster.visibility} />
            </div>
          </div>
        </div>

        <EntityActionsMenu
          editHref={`/campaigns/${campaignId}/monsters/${monsterId}/edit`}
          favorite={monster.favorite}
          archived={monster.archived}
          onToggleFavorite={toggleMonsterFavoriteAction.bind(null, campaignId, monsterId)}
          onToggleArchived={toggleMonsterArchivedAction.bind(null, campaignId, monsterId)}
          onDelete={deleteMonsterAction.bind(null, campaignId, monsterId)}
          deleteTitle={`Excluir "${monster.name}"?`}
          deleteDescription="Esta ação não pode ser desfeita. Atributos e relações deste monstro também serão removidos."
        />
      </div>

      {monster.tags.length > 0 && (
        <TagBadgeList
          tags={monster.tags.map((entry) => entry.tag)}
          campaignId={campaignId}
          linkBasePath={`/campaigns/${campaignId}/monsters`}
        />
      )}

      {monster.description ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Descrição</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap pt-0 text-sm">{monster.description}</CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum detalhe preenchido ainda.</p>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Atributos</h2>
        <MonsterAttributeList attributes={monster.attributes} campaignId={campaignId} monsterId={monsterId} />
      </div>

      <RelatedEntitiesPanel
        campaignId={campaignId}
        entityType="MONSTER"
        entityId={monsterId}
        relationships={relationships}
      />
    </div>
  );
}
