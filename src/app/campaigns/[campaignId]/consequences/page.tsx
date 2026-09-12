import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import type { ConsequenceStatus } from "@/generated/prisma/client";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listConsequences } from "@/modules/preparation/consequences/queries";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WikiListToolbar } from "@/components/wiki/wiki-list-toolbar";
import { WikiEntityGrid } from "@/components/wiki/wiki-entity-grid";
import { EmptyState } from "@/components/wiki/empty-state";
import { CONSEQUENCE_STATUS_OPTIONS, CONSEQUENCE_STATUS_LABELS, CONSEQUENCE_STATUS_BADGE_VARIANT } from "@/components/wiki/status-config";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";

export const metadata: Metadata = { title: "Consequências" };

const VALID_STATUSES = new Set(CONSEQUENCE_STATUS_OPTIONS.map(([value]) => value));

interface ConsequencesPageProps {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ConsequencesPage({ params, searchParams }: ConsequencesPageProps) {
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
    typeof sp.status === "string" && VALID_STATUSES.has(sp.status as ConsequenceStatus)
      ? (sp.status as ConsequenceStatus)
      : undefined;
  const favorite = sp.favorite === "1";
  const archived = sp.archived === "1";

  const [consequences, tags] = await Promise.all([
    listConsequences(campaignId, { q, tag, status, favorite, archived }),
    listTagsForCampaign(campaignId),
  ]);

  const entities = consequences.map((c) => ({
    id: c.id,
    href: `/campaigns/${campaignId}/consequences/${c.id}`,
    name: c.title,
    imageUrl: null,
    excerpt: c.trigger || c.description,
    statusBadges: (
      <>
        <Badge variant={CONSEQUENCE_STATUS_BADGE_VARIANT[c.status]}>{CONSEQUENCE_STATUS_LABELS[c.status]}</Badge>
        <VisibilityBadge visibility={c.visibility} />
      </>
    ),
    favorite: c.favorite,
    meta: null,
    tags: c.tags.map((entry) => entry.tag),
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Consequências</h1>
          <p className="text-sm text-muted-foreground">O que as escolhas dos jogadores estão semeando na campanha.</p>
        </div>
        <Button asChild>
          <Link href={`/campaigns/${campaignId}/consequences/new`}>
            <Plus className="size-4" /> Nova consequência
          </Link>
        </Button>
      </div>

      <WikiListToolbar tags={tags} statusOptions={CONSEQUENCE_STATUS_OPTIONS} searchPlaceholder="Buscar consequências…" />

      {entities.length === 0 ? (
        <EmptyState
          message="Nenhuma consequência registrada ainda."
          action={
            <Button asChild>
              <Link href={`/campaigns/${campaignId}/consequences/new`}>
                <Plus className="size-4" /> Registrar primeira consequência
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
