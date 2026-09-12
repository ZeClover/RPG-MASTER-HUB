import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import type { CanonStatus } from "@/generated/prisma/client";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listMonsters } from "@/modules/gametools/monsters/queries";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WikiListToolbar } from "@/components/wiki/wiki-list-toolbar";
import { WikiEntityGrid } from "@/components/wiki/wiki-entity-grid";
import { EmptyState } from "@/components/wiki/empty-state";
import { CANON_STATUS_OPTIONS } from "@/components/wiki/status-config";
import { CanonStatusBadge } from "@/components/wiki/canon-status-badge";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";

export const metadata: Metadata = { title: "Monstros" };

const VALID_STATUSES = new Set(CANON_STATUS_OPTIONS.map(([value]) => value));

interface MonstersPageProps {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MonstersPage({ params, searchParams }: MonstersPageProps) {
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

  const [monsters, tags] = await Promise.all([
    listMonsters(campaignId, { q, tag, status, favorite, archived }),
    listTagsForCampaign(campaignId),
  ]);

  const entities = monsters.map((monster) => ({
    id: monster.id,
    href: `/campaigns/${campaignId}/monsters/${monster.id}`,
    name: monster.name,
    imageUrl: monster.imageUrl,
    excerpt: monster.description,
    statusBadges: (
      <>
        {monster.isBoss && <Badge variant="destructive">Chefe</Badge>}
        <CanonStatusBadge status={monster.canonStatus} />
        <VisibilityBadge visibility={monster.visibility} />
      </>
    ),
    favorite: monster.favorite,
    meta: monster.isBoss ? "Chefe" : "Monstro",
    tags: monster.tags.map((entry) => entry.tag),
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Monstros</h1>
          <p className="text-sm text-muted-foreground">Monstros e chefes da campanha, com atributos livres.</p>
        </div>
        <Button asChild>
          <Link href={`/campaigns/${campaignId}/monsters/new`}>
            <Plus className="size-4" /> Novo monstro
          </Link>
        </Button>
      </div>

      <WikiListToolbar tags={tags} statusOptions={CANON_STATUS_OPTIONS} searchPlaceholder="Buscar monstros…" />

      {entities.length === 0 ? (
        <EmptyState
          message="Nenhum monstro criado ainda."
          action={
            <Button asChild>
              <Link href={`/campaigns/${campaignId}/monsters/new`}>
                <Plus className="size-4" /> Criar primeiro monstro
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
