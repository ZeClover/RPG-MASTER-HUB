import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import type { CanonStatus } from "@/generated/prisma/client";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listPowers } from "@/modules/gametools/powers/queries";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { Button } from "@/components/ui/button";
import { WikiListToolbar } from "@/components/wiki/wiki-list-toolbar";
import { WikiEntityGrid } from "@/components/wiki/wiki-entity-grid";
import { EmptyState } from "@/components/wiki/empty-state";
import { CANON_STATUS_OPTIONS } from "@/components/wiki/status-config";
import { CanonStatusBadge } from "@/components/wiki/canon-status-badge";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";

export const metadata: Metadata = { title: "Poderes" };

const VALID_STATUSES = new Set(CANON_STATUS_OPTIONS.map(([value]) => value));

interface PowersPageProps {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PowersPage({ params, searchParams }: PowersPageProps) {
  const { campaignId } = await params;
  const sp = await searchParams;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId);
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

  const [powers, tags] = await Promise.all([
    listPowers(campaignId, { q, tag, status, favorite, archived }),
    listTagsForCampaign(campaignId),
  ]);

  const entities = powers.map((power) => ({
    id: power.id,
    href: `/campaigns/${campaignId}/powers/${power.id}`,
    name: power.name,
    imageUrl: null,
    excerpt: power.effect ?? power.description,
    statusBadges: (
      <>
        <CanonStatusBadge status={power.canonStatus} />
        <VisibilityBadge visibility={power.visibility} />
      </>
    ),
    favorite: power.favorite,
    meta: power.cost,
    tags: power.tags.map((entry) => entry.tag),
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Poderes</h1>
          <p className="text-sm text-muted-foreground">Poderes, habilidades e magias da campanha.</p>
        </div>
        <Button asChild>
          <Link href={`/campaigns/${campaignId}/powers/new`}>
            <Plus className="size-4" /> Novo poder
          </Link>
        </Button>
      </div>

      <WikiListToolbar tags={tags} statusOptions={CANON_STATUS_OPTIONS} searchPlaceholder="Buscar poderes…" />

      {entities.length === 0 ? (
        <EmptyState
          message="Nenhum poder criado ainda."
          action={
            <Button asChild>
              <Link href={`/campaigns/${campaignId}/powers/new`}>
                <Plus className="size-4" /> Criar primeiro poder
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
