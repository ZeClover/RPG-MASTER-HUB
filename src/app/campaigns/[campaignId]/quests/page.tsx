import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import type { QuestStatus } from "@/generated/prisma/client";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listQuests } from "@/modules/preparation/quests/queries";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WikiListToolbar } from "@/components/wiki/wiki-list-toolbar";
import { WikiEntityGrid } from "@/components/wiki/wiki-entity-grid";
import { EmptyState } from "@/components/wiki/empty-state";
import { QUEST_STATUS_OPTIONS, QUEST_STATUS_LABELS, QUEST_STATUS_BADGE_VARIANT } from "@/components/wiki/status-config";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";

export const metadata: Metadata = { title: "Missões" };

const VALID_STATUSES = new Set(QUEST_STATUS_OPTIONS.map(([value]) => value));

interface QuestsPageProps {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function QuestsPage({ params, searchParams }: QuestsPageProps) {
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
    typeof sp.status === "string" && VALID_STATUSES.has(sp.status as QuestStatus)
      ? (sp.status as QuestStatus)
      : undefined;
  const favorite = sp.favorite === "1";
  const archived = sp.archived === "1";

  const [quests, tags] = await Promise.all([
    listQuests(campaignId, { q, tag, status, favorite, archived }, role),
    listTagsForCampaign(campaignId),
  ]);

  const entities = quests.map((quest) => ({
    id: quest.id,
    href: `/campaigns/${campaignId}/quests/${quest.id}`,
    name: quest.title,
    imageUrl: null,
    excerpt: quest.objective || quest.description,
    statusBadges: (
      <>
        <Badge variant={QUEST_STATUS_BADGE_VARIANT[quest.status]}>{QUEST_STATUS_LABELS[quest.status]}</Badge>
        <VisibilityBadge visibility={quest.visibility} />
      </>
    ),
    favorite: quest.favorite,
    meta: null,
    tags: quest.tags.map((entry) => entry.tag),
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Missões</h1>
          <p className="text-sm text-muted-foreground">Objetivos e ganchos narrativos da campanha.</p>
        </div>
        <Button asChild>
          <Link href={`/campaigns/${campaignId}/quests/new`}>
            <Plus className="size-4" /> Nova missão
          </Link>
        </Button>
      </div>

      <WikiListToolbar tags={tags} statusOptions={QUEST_STATUS_OPTIONS} searchPlaceholder="Buscar missões…" />

      {entities.length === 0 ? (
        <EmptyState
          message="Nenhuma missão criada ainda."
          action={
            <Button asChild>
              <Link href={`/campaigns/${campaignId}/quests/new`}>
                <Plus className="size-4" /> Criar primeira missão
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
