import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import type { CanonStatus } from "@/generated/prisma/client";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listLocations } from "@/modules/creation/locations/queries";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { Button } from "@/components/ui/button";
import { WikiListToolbar } from "@/components/wiki/wiki-list-toolbar";
import { WikiEntityGrid } from "@/components/wiki/wiki-entity-grid";
import { EmptyState } from "@/components/wiki/empty-state";
import { CANON_STATUS_OPTIONS } from "@/components/wiki/status-config";
import { CanonStatusBadge } from "@/components/wiki/canon-status-badge";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";

export const metadata: Metadata = { title: "Locais" };

const VALID_STATUSES = new Set(CANON_STATUS_OPTIONS.map(([value]) => value));

interface LocationsPageProps {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LocationsPage({ params, searchParams }: LocationsPageProps) {
  const { campaignId } = await params;
  const sp = await searchParams;
  const user = await requireUser();

  let role;
  try {
    ({ role } = await requireCampaignAccess(user.id, campaignId));
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const q = typeof sp.q === "string" ? sp.q : undefined;
  const tag = typeof sp.tag === "string" ? sp.tag : undefined;
  const status =
    typeof sp.status === "string" && VALID_STATUSES.has(sp.status as CanonStatus)
      ? (sp.status as CanonStatus)
      : undefined;
  const favorite = sp.favorite === "1";
  const archived = sp.archived === "1";

  const [locations, tags] = await Promise.all([
    listLocations(campaignId, { q, tag, status, favorite, archived }, role),
    listTagsForCampaign(campaignId),
  ]);

  const entities = locations.map((location) => ({
    id: location.id,
    href: `/campaigns/${campaignId}/locations/${location.id}`,
    name: location.name,
    imageUrl: location.imageUrl,
    excerpt: location.description,
    statusBadges: (
      <>
        <CanonStatusBadge status={location.canonStatus} />
        <VisibilityBadge visibility={location.visibility} />
      </>
    ),
    favorite: location.favorite,
    meta: [location.locationType, location.parent ? `Em ${location.parent.name}` : null].filter(Boolean).join(" · ") || null,
    tags: location.tags.map((entry) => entry.tag),
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Locais</h1>
          <p className="text-sm text-muted-foreground">Mundo, regiões, cidades e todos os lugares da campanha.</p>
        </div>
        <Button asChild>
          <Link href={`/campaigns/${campaignId}/locations/new`}>
            <Plus className="size-4" /> Novo local
          </Link>
        </Button>
      </div>

      <WikiListToolbar tags={tags} statusOptions={CANON_STATUS_OPTIONS} searchPlaceholder="Buscar locais…" />

      {entities.length === 0 ? (
        <EmptyState
          message="Nenhum local criado ainda."
          action={
            <Button asChild>
              <Link href={`/campaigns/${campaignId}/locations/new`}>
                <Plus className="size-4" /> Criar primeiro local
              </Link>
            </Button>
          }
        />
      ) : (
        <WikiEntityGrid entities={entities} />
      )}
    </div>
  );
}
