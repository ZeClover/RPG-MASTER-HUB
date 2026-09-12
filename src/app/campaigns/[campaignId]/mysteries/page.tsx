import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import type { MysteryStatus } from "@/generated/prisma/client";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listMysteries } from "@/modules/worldbuilding/mysteries/queries";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WikiListToolbar } from "@/components/wiki/wiki-list-toolbar";
import { WikiEntityGrid } from "@/components/wiki/wiki-entity-grid";
import { EmptyState } from "@/components/wiki/empty-state";
import {
  MYSTERY_STATUS_OPTIONS,
  MYSTERY_STATUS_LABELS,
  MYSTERY_STATUS_BADGE_VARIANT,
} from "@/components/wiki/status-config";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";

export const metadata: Metadata = { title: "Mystery Board" };

const VALID_STATUSES = new Set(MYSTERY_STATUS_OPTIONS.map(([value]) => value));

interface MysteriesPageProps {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MysteriesPage({ params, searchParams }: MysteriesPageProps) {
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
    typeof sp.status === "string" && VALID_STATUSES.has(sp.status as MysteryStatus)
      ? (sp.status as MysteryStatus)
      : undefined;
  const favorite = sp.favorite === "1";
  const archived = sp.archived === "1";

  const [mysteries, tags] = await Promise.all([
    listMysteries(campaignId, { q, tag, status, favorite, archived }),
    listTagsForCampaign(campaignId),
  ]);

  const entities = mysteries.map((mystery) => ({
    id: mystery.id,
    href: `/campaigns/${campaignId}/mysteries/${mystery.id}`,
    name: mystery.title,
    imageUrl: null,
    excerpt: mystery.description,
    statusBadges: (
      <>
        <Badge variant={MYSTERY_STATUS_BADGE_VARIANT[mystery.status]}>
          {MYSTERY_STATUS_LABELS[mystery.status]}
        </Badge>
        <VisibilityBadge visibility={mystery.visibility} />
      </>
    ),
    favorite: mystery.favorite,
    meta: null,
    tags: mystery.tags.map((entry) => entry.tag),
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Mystery Board</h1>
          <p className="text-sm text-muted-foreground">Mistérios e investigações da campanha, com suas pistas.</p>
        </div>
        <Button asChild>
          <Link href={`/campaigns/${campaignId}/mysteries/new`}>
            <Plus className="size-4" /> Novo mistério
          </Link>
        </Button>
      </div>

      <WikiListToolbar tags={tags} statusOptions={MYSTERY_STATUS_OPTIONS} searchPlaceholder="Buscar mistérios…" />

      {entities.length === 0 ? (
        <EmptyState
          message="Nenhum mistério criado ainda."
          action={
            <Button asChild>
              <Link href={`/campaigns/${campaignId}/mysteries/new`}>
                <Plus className="size-4" /> Criar primeiro mistério
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
