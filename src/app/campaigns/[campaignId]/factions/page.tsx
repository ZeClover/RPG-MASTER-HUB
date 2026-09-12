import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import type { CanonStatus } from "@/generated/prisma/client";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listFactions } from "@/modules/creation/factions/queries";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { Button } from "@/components/ui/button";
import { WikiListToolbar } from "@/components/wiki/wiki-list-toolbar";
import { WikiEntityGrid } from "@/components/wiki/wiki-entity-grid";
import { EmptyState } from "@/components/wiki/empty-state";
import { CANON_STATUS_OPTIONS } from "@/components/wiki/status-config";
import { CanonStatusBadge } from "@/components/wiki/canon-status-badge";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";

export const metadata: Metadata = { title: "Facções" };

const VALID_STATUSES = new Set(CANON_STATUS_OPTIONS.map(([value]) => value));

interface FactionsPageProps {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function FactionsPage({ params, searchParams }: FactionsPageProps) {
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

  const [factions, tags] = await Promise.all([
    listFactions(campaignId, { q, tag, status, favorite, archived }),
    listTagsForCampaign(campaignId),
  ]);

  const entities = factions.map((faction) => ({
    id: faction.id,
    href: `/campaigns/${campaignId}/factions/${faction.id}`,
    name: faction.name,
    imageUrl: faction.imageUrl,
    excerpt: faction.description,
    statusBadges: (
      <>
        <CanonStatusBadge status={faction.canonStatus} />
        <VisibilityBadge visibility={faction.visibility} />
      </>
    ),
    favorite: faction.favorite,
    meta: faction.factionType,
    tags: faction.tags.map((entry) => entry.tag),
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Facções</h1>
          <p className="text-sm text-muted-foreground">Guildas, reinos, cultos e outras organizações.</p>
        </div>
        <Button asChild>
          <Link href={`/campaigns/${campaignId}/factions/new`}>
            <Plus className="size-4" /> Nova facção
          </Link>
        </Button>
      </div>

      <WikiListToolbar tags={tags} statusOptions={CANON_STATUS_OPTIONS} searchPlaceholder="Buscar facções…" />

      {entities.length === 0 ? (
        <EmptyState
          message="Nenhuma facção criada ainda."
          action={
            <Button asChild>
              <Link href={`/campaigns/${campaignId}/factions/new`}>
                <Plus className="size-4" /> Criar primeira facção
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
