import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess } from "@/modules/core/permissions";
import { getLorePageForUser } from "@/modules/creation/lore/queries";
import {
  deleteLorePageAction,
  toggleLorePageArchivedAction,
  toggleLorePageFavoriteAction,
} from "@/modules/creation/lore/actions";
import { listRelationshipsForEntity } from "@/modules/creation/relationships/queries";
import { CanonStatusBadge } from "@/components/wiki/canon-status-badge";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";
import { RevealToPlayersButton } from "@/components/players/reveal-to-players-button";
import { TagBadgeList } from "@/components/wiki/tag-badge-list";
import { RelatedEntitiesPanel } from "@/components/wiki/related-entities-panel";
import { EntityActionsMenu } from "@/components/wiki/entity-actions-menu";
import { MarkdownContent } from "@/components/wiki/markdown-content";

interface LorePageDetailProps {
  params: Promise<{ campaignId: string; lorePageId: string }>;
}

export async function generateMetadata({ params }: LorePageDetailProps): Promise<Metadata> {
  const { campaignId, lorePageId } = await params;
  const user = await requireUser();
  const lorePage = await getLorePageForUser(user.id, campaignId, lorePageId).catch(() => null);
  return { title: lorePage?.title ?? "Lore" };
}

export default async function LorePageDetail({ params }: LorePageDetailProps) {
  const { campaignId, lorePageId } = await params;
  const user = await requireUser();
  const lorePage = await getLorePageForUser(user.id, campaignId, lorePageId);
  if (!lorePage) notFound();
  const { role } = await requireCampaignAccess(user.id, campaignId);
  const canManage = role !== "PLAYER";

  const relationships = await listRelationshipsForEntity(campaignId, "LORE_PAGE", lorePageId, role);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      {lorePage.imageUrl && (
        <div className="h-48 w-full overflow-hidden rounded-xl border border-border bg-surface-elevated">
          {/* eslint-disable-next-line @next/next/no-img-element -- URL dinâmica de storage */}
          <img src={lorePage.imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">{lorePage.title}</h1>
          <p className="text-sm text-muted-foreground">{lorePage.category || "Sem categoria"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <CanonStatusBadge status={lorePage.canonStatus} />
            <VisibilityBadge visibility={lorePage.visibility} />
            {canManage && lorePage.visibility === "GM_ONLY" && (
              <RevealToPlayersButton campaignId={campaignId} entityType="LORE_PAGE" entityId={lorePageId} />
            )}
          </div>
        </div>

        {canManage && (
          <EntityActionsMenu
            editHref={`/campaigns/${campaignId}/lore/${lorePageId}/edit`}
            favorite={lorePage.favorite}
            archived={lorePage.archived}
            onToggleFavorite={toggleLorePageFavoriteAction.bind(null, campaignId, lorePageId)}
            onToggleArchived={toggleLorePageArchivedAction.bind(null, campaignId, lorePageId)}
            onDelete={deleteLorePageAction.bind(null, campaignId, lorePageId)}
            deleteTitle={`Excluir "${lorePage.title}"?`}
            deleteDescription="Esta ação não pode ser desfeita. Relações com esta página também serão removidas."
          />
        )}
      </div>

      {lorePage.tags.length > 0 && (
        <TagBadgeList
          tags={lorePage.tags.map((entry) => entry.tag)}
          campaignId={campaignId}
          linkBasePath={`/campaigns/${campaignId}/lore`}
        />
      )}

      {lorePage.content ? (
        <MarkdownContent source={lorePage.content} />
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum conteúdo escrito ainda.</p>
      )}

      <RelatedEntitiesPanel
        campaignId={campaignId}
        entityType="LORE_PAGE"
        entityId={lorePageId}
        relationships={relationships}
        canManage={canManage}
      />
    </div>
  );
}
