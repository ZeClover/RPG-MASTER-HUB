import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import {
  getLocationBreadcrumb,
  getLocationForUser,
  listLocationChildren,
} from "@/modules/creation/locations/queries";
import {
  deleteLocationAction,
  toggleLocationArchivedAction,
  toggleLocationFavoriteAction,
} from "@/modules/creation/locations/actions";
import { listRelationshipsForEntity } from "@/modules/creation/relationships/queries";
import { CanonStatusBadge } from "@/components/wiki/canon-status-badge";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";
import { TagBadgeList } from "@/components/wiki/tag-badge-list";
import { RelatedEntitiesPanel } from "@/components/wiki/related-entities-panel";
import { EntityActionsMenu } from "@/components/wiki/entity-actions-menu";
import { LocationBreadcrumb } from "@/components/locations/location-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WikiEntityGrid } from "@/components/wiki/wiki-entity-grid";

interface LocationDetailPageProps {
  params: Promise<{ campaignId: string; locationId: string }>;
}

export async function generateMetadata({ params }: LocationDetailPageProps): Promise<Metadata> {
  const { campaignId, locationId } = await params;
  const user = await requireUser();
  const location = await getLocationForUser(user.id, campaignId, locationId).catch(() => null);
  return { title: location?.name ?? "Local" };
}

export default async function LocationDetailPage({ params }: LocationDetailPageProps) {
  const { campaignId, locationId } = await params;
  const user = await requireUser();
  const location = await getLocationForUser(user.id, campaignId, locationId);
  if (!location) notFound();

  const [breadcrumb, children, relationships] = await Promise.all([
    getLocationBreadcrumb(locationId),
    listLocationChildren(campaignId, locationId),
    listRelationshipsForEntity(campaignId, "LOCATION", locationId),
  ]);

  const childEntities = children.map((child) => ({
    id: child.id,
    href: `/campaigns/${campaignId}/locations/${child.id}`,
    name: child.name,
    imageUrl: child.imageUrl,
    excerpt: child.description,
    statusBadges: (
      <>
        <CanonStatusBadge status={child.canonStatus} />
        <VisibilityBadge visibility={child.visibility} />
      </>
    ),
    favorite: child.favorite,
    tags: [],
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <LocationBreadcrumb campaignId={campaignId} chain={breadcrumb} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-elevated text-xl font-semibold">
            {location.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL dinâmica de storage
              <img src={location.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              location.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{location.name}</h1>
            <p className="text-sm text-muted-foreground">{location.locationType || "Sem tipo definido"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <CanonStatusBadge status={location.canonStatus} />
              <VisibilityBadge visibility={location.visibility} />
            </div>
          </div>
        </div>

        <EntityActionsMenu
          editHref={`/campaigns/${campaignId}/locations/${locationId}/edit`}
          favorite={location.favorite}
          archived={location.archived}
          onToggleFavorite={toggleLocationFavoriteAction.bind(null, campaignId, locationId)}
          onToggleArchived={toggleLocationArchivedAction.bind(null, campaignId, locationId)}
          onDelete={deleteLocationAction.bind(null, campaignId, locationId)}
          deleteTitle={`Excluir "${location.name}"?`}
          deleteDescription="Esta ação não pode ser desfeita. Relações com este local também serão removidas."
        />
      </div>

      {location.tags.length > 0 && (
        <TagBadgeList
          tags={location.tags.map((entry) => entry.tag)}
          campaignId={campaignId}
          linkBasePath={`/campaigns/${campaignId}/locations`}
        />
      )}

      {location.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Descrição</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap pt-0 text-sm">{location.description}</CardContent>
        </Card>
      )}

      {location.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Notas</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap pt-0 text-sm">{location.notes}</CardContent>
        </Card>
      )}

      {childEntities.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Sublocais ({childEntities.length})</h2>
          <WikiEntityGrid entities={childEntities} />
        </div>
      )}

      {!location.description && !location.notes && (
        <p className="text-sm text-muted-foreground">
          Nenhum detalhe preenchido ainda.{" "}
          <Link href={`/campaigns/${campaignId}/locations/${locationId}/edit`} className="text-primary hover:underline">
            Editar
          </Link>
        </p>
      )}

      <RelatedEntitiesPanel
        campaignId={campaignId}
        entityType="LOCATION"
        entityId={locationId}
        relationships={relationships}
      />
    </div>
  );
}
