import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import type { PlotThreadStatus } from "@/generated/prisma/client";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listPlotThreads } from "@/modules/preparation/plot-threads/queries";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { RELATIONSHIP_IMPORTANCE_LABELS } from "@/modules/creation/relationships/config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WikiListToolbar } from "@/components/wiki/wiki-list-toolbar";
import { WikiEntityGrid } from "@/components/wiki/wiki-entity-grid";
import { EmptyState } from "@/components/wiki/empty-state";
import {
  PLOT_THREAD_STATUS_OPTIONS,
  PLOT_THREAD_STATUS_LABELS,
  PLOT_THREAD_STATUS_BADGE_VARIANT,
} from "@/components/wiki/status-config";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";

export const metadata: Metadata = { title: "Tramas" };

const VALID_STATUSES = new Set(PLOT_THREAD_STATUS_OPTIONS.map(([value]) => value));

interface PlotThreadsPageProps {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PlotThreadsPage({ params, searchParams }: PlotThreadsPageProps) {
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
    typeof sp.status === "string" && VALID_STATUSES.has(sp.status as PlotThreadStatus)
      ? (sp.status as PlotThreadStatus)
      : undefined;
  const favorite = sp.favorite === "1";
  const archived = sp.archived === "1";

  const [plotThreads, tags] = await Promise.all([
    listPlotThreads(campaignId, { q, tag, status, favorite, archived }, role),
    listTagsForCampaign(campaignId),
  ]);

  const entities = plotThreads.map((thread) => ({
    id: thread.id,
    href: `/campaigns/${campaignId}/plot-threads/${thread.id}`,
    name: thread.title,
    imageUrl: null,
    excerpt: thread.description,
    statusBadges: (
      <>
        <Badge variant={PLOT_THREAD_STATUS_BADGE_VARIANT[thread.status]}>
          {PLOT_THREAD_STATUS_LABELS[thread.status]}
        </Badge>
        <VisibilityBadge visibility={thread.visibility} />
      </>
    ),
    favorite: thread.favorite,
    meta: RELATIONSHIP_IMPORTANCE_LABELS[thread.importance],
    tags: thread.tags.map((entry) => entry.tag),
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Tramas</h1>
          <p className="text-sm text-muted-foreground">Arcos narrativos em andamento na campanha.</p>
        </div>
        <Button asChild>
          <Link href={`/campaigns/${campaignId}/plot-threads/new`}>
            <Plus className="size-4" /> Nova trama
          </Link>
        </Button>
      </div>

      <WikiListToolbar tags={tags} statusOptions={PLOT_THREAD_STATUS_OPTIONS} searchPlaceholder="Buscar tramas…" />

      {entities.length === 0 ? (
        <EmptyState
          message="Nenhuma trama criada ainda."
          action={
            <Button asChild>
              <Link href={`/campaigns/${campaignId}/plot-threads/new`}>
                <Plus className="size-4" /> Criar primeira trama
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
