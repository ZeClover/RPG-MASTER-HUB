import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import type { CanonStatus } from "@/generated/prisma/client";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listNpcs } from "@/modules/creation/npcs/queries";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { Button } from "@/components/ui/button";
import { WikiListToolbar } from "@/components/wiki/wiki-list-toolbar";
import { WikiEntityGrid } from "@/components/wiki/wiki-entity-grid";
import { EmptyState } from "@/components/wiki/empty-state";
import { CANON_STATUS_OPTIONS } from "@/components/wiki/status-config";
import { CanonStatusBadge } from "@/components/wiki/canon-status-badge";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";

export const metadata: Metadata = { title: "NPCs" };

const VALID_STATUSES = new Set(CANON_STATUS_OPTIONS.map(([value]) => value));

interface NpcsPageProps {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NpcsPage({ params, searchParams }: NpcsPageProps) {
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

  const [npcs, tags] = await Promise.all([
    listNpcs(campaignId, { q, tag, status, favorite, archived }, role),
    listTagsForCampaign(campaignId),
  ]);

  const entities = npcs.map((npc) => ({
    id: npc.id,
    href: `/campaigns/${campaignId}/npcs/${npc.id}`,
    name: npc.name,
    imageUrl: npc.imageUrl,
    excerpt: npc.personality || npc.appearance,
    statusBadges: (
      <>
        <CanonStatusBadge status={npc.canonStatus} />
        <VisibilityBadge visibility={npc.visibility} />
      </>
    ),
    favorite: npc.favorite,
    meta: [npc.species, npc.narrativeStatus].filter(Boolean).join(" · ") || null,
    tags: npc.tags.map((entry) => entry.tag),
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">NPCs</h1>
          <p className="text-sm text-muted-foreground">Personagens não jogáveis da campanha.</p>
        </div>
        <Button asChild>
          <Link href={`/campaigns/${campaignId}/npcs/new`}>
            <Plus className="size-4" /> Novo NPC
          </Link>
        </Button>
      </div>

      <WikiListToolbar tags={tags} statusOptions={CANON_STATUS_OPTIONS} searchPlaceholder="Buscar NPCs…" />

      {entities.length === 0 ? (
        <EmptyState
          message="Nenhum NPC criado ainda."
          action={
            <Button asChild>
              <Link href={`/campaigns/${campaignId}/npcs/new`}>
                <Plus className="size-4" /> Criar primeiro NPC
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
