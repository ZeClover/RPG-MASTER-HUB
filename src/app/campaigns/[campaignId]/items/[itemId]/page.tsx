import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { getItemForUser } from "@/modules/gametools/items/queries";
import { deleteItemAction, toggleItemArchivedAction, toggleItemFavoriteAction } from "@/modules/gametools/items/actions";
import { listRelationshipsForEntity } from "@/modules/creation/relationships/queries";
import { CanonStatusBadge } from "@/components/wiki/canon-status-badge";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";
import { TagBadgeList } from "@/components/wiki/tag-badge-list";
import { RelatedEntitiesPanel } from "@/components/wiki/related-entities-panel";
import { EntityActionsMenu } from "@/components/wiki/entity-actions-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ItemDetailPageProps {
  params: Promise<{ campaignId: string; itemId: string }>;
}

export async function generateMetadata({ params }: ItemDetailPageProps): Promise<Metadata> {
  const { campaignId, itemId } = await params;
  const user = await requireUser();
  const item = await getItemForUser(user.id, campaignId, itemId).catch(() => null);
  return { title: item?.name ?? "Item" };
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { campaignId, itemId } = await params;
  const user = await requireUser();
  const item = await getItemForUser(user.id, campaignId, itemId);
  if (!item) notFound();

  const relationships = await listRelationshipsForEntity(campaignId, "ITEM", itemId);

  const fields: { label: string; value: string | null }[] = [
    { label: "Descrição", value: item.description },
    { label: "Efeito", value: item.effect },
  ];
  const filledFields = fields.filter((field) => field.value);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-elevated text-xl font-semibold">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL dinâmica de storage
              <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              item.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{item.name}</h1>
            <p className="text-sm text-muted-foreground">{item.category || "Sem tipo/raridade definido"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <CanonStatusBadge status={item.canonStatus} />
              <VisibilityBadge visibility={item.visibility} />
            </div>
          </div>
        </div>

        <EntityActionsMenu
          editHref={`/campaigns/${campaignId}/items/${itemId}/edit`}
          favorite={item.favorite}
          archived={item.archived}
          onToggleFavorite={toggleItemFavoriteAction.bind(null, campaignId, itemId)}
          onToggleArchived={toggleItemArchivedAction.bind(null, campaignId, itemId)}
          onDelete={deleteItemAction.bind(null, campaignId, itemId)}
          deleteTitle={`Excluir "${item.name}"?`}
          deleteDescription="Esta ação não pode ser desfeita. Relações com este item também serão removidas."
        />
      </div>

      {item.tags.length > 0 && (
        <TagBadgeList
          tags={item.tags.map((entry) => entry.tag)}
          campaignId={campaignId}
          linkBasePath={`/campaigns/${campaignId}/items`}
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

      <RelatedEntitiesPanel campaignId={campaignId} entityType="ITEM" entityId={itemId} relationships={relationships} />
    </div>
  );
}
