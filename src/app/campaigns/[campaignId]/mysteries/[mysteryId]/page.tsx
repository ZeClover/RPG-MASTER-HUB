import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";

import { requireUser } from "@/modules/core/auth/session";
import { getMysteryForUser, resolveClueLinks } from "@/modules/worldbuilding/mysteries/queries";
import {
  deleteMysteryAction,
  toggleMysteryArchivedAction,
  toggleMysteryFavoriteAction,
} from "@/modules/worldbuilding/mysteries/actions";
import { listRelationshipsForEntity } from "@/modules/creation/relationships/queries";
import { Badge } from "@/components/ui/badge";
import { MYSTERY_STATUS_LABELS, MYSTERY_STATUS_BADGE_VARIANT } from "@/components/wiki/status-config";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";
import { TagBadgeList } from "@/components/wiki/tag-badge-list";
import { RelatedEntitiesPanel } from "@/components/wiki/related-entities-panel";
import { EntityActionsMenu } from "@/components/wiki/entity-actions-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClueList } from "@/components/mysteries/clue-list";

interface MysteryDetailPageProps {
  params: Promise<{ campaignId: string; mysteryId: string }>;
}

export async function generateMetadata({ params }: MysteryDetailPageProps): Promise<Metadata> {
  const { campaignId, mysteryId } = await params;
  const user = await requireUser();
  const mystery = await getMysteryForUser(user.id, campaignId, mysteryId).catch(() => null);
  return { title: mystery?.title ?? "Mistério" };
}

export default async function MysteryDetailPage({ params }: MysteryDetailPageProps) {
  const { campaignId, mysteryId } = await params;
  const user = await requireUser();
  const mystery = await getMysteryForUser(user.id, campaignId, mysteryId);
  if (!mystery) notFound();

  const [relationships, linkedEntities] = await Promise.all([
    listRelationshipsForEntity(campaignId, "MYSTERY", mysteryId),
    resolveClueLinks(campaignId, mystery.clues),
  ]);
  const linkedEntitiesByKey = Object.fromEntries(linkedEntities);

  const discoveredCount = mystery.clues.filter((clue) => clue.discovered).length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-elevated text-xl font-semibold">
            <Search className="size-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{mystery.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant={MYSTERY_STATUS_BADGE_VARIANT[mystery.status]}>
                {MYSTERY_STATUS_LABELS[mystery.status]}
              </Badge>
              <VisibilityBadge visibility={mystery.visibility} />
            </div>
          </div>
        </div>

        <EntityActionsMenu
          editHref={`/campaigns/${campaignId}/mysteries/${mysteryId}/edit`}
          favorite={mystery.favorite}
          archived={mystery.archived}
          onToggleFavorite={toggleMysteryFavoriteAction.bind(null, campaignId, mysteryId)}
          onToggleArchived={toggleMysteryArchivedAction.bind(null, campaignId, mysteryId)}
          onDelete={deleteMysteryAction.bind(null, campaignId, mysteryId)}
          deleteTitle={`Excluir "${mystery.title}"?`}
          deleteDescription="Esta ação não pode ser desfeita. As pistas e relações deste mistério também serão removidas."
        />
      </div>

      {mystery.tags.length > 0 && (
        <TagBadgeList
          tags={mystery.tags.map((entry) => entry.tag)}
          campaignId={campaignId}
          linkBasePath={`/campaigns/${campaignId}/mysteries`}
        />
      )}

      {mystery.description ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Descrição</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap pt-0 text-sm">{mystery.description}</CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum detalhe preenchido ainda.</p>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">
          Pistas {mystery.clues.length > 0 && `(${discoveredCount}/${mystery.clues.length} descobertas)`}
        </h2>
        <ClueList
          clues={mystery.clues}
          campaignId={campaignId}
          mysteryId={mysteryId}
          linkedEntitiesByKey={linkedEntitiesByKey}
        />
      </div>

      <RelatedEntitiesPanel
        campaignId={campaignId}
        entityType="MYSTERY"
        entityId={mysteryId}
        relationships={relationships}
      />
    </div>
  );
}
