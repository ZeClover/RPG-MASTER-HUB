import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { IdeaState } from "@/generated/prisma/client";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listIdeas } from "@/modules/creation/ideas/queries";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { QuickAddIdeaForm } from "@/components/ideas/quick-add-idea-form";
import { IdeaCard } from "@/components/ideas/idea-card";
import { WikiListToolbar } from "@/components/wiki/wiki-list-toolbar";
import { EmptyState } from "@/components/wiki/empty-state";
import { IDEA_STATE_OPTIONS } from "@/components/wiki/status-config";

export const metadata: Metadata = { title: "Idea Vault" };

const VALID_STATES = new Set(IDEA_STATE_OPTIONS.map(([value]) => value));

interface IdeasPageProps {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function IdeasPage({ params, searchParams }: IdeasPageProps) {
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
  const state =
    typeof sp.state === "string" && VALID_STATES.has(sp.state as IdeaState) ? (sp.state as IdeaState) : undefined;
  const favorite = sp.favorite === "1";
  const archived = sp.archived === "1";

  const [ideas, tags] = await Promise.all([
    listIdeas(campaignId, { q, tag, state, favorite, archived }),
    listTagsForCampaign(campaignId),
  ]);

  const summaries = ideas.map((idea) => ({
    id: idea.id,
    title: idea.title,
    content: idea.content,
    state: idea.state,
    favorite: idea.favorite,
    archived: idea.archived,
    tags: idea.tags.map((entry) => entry.tag),
  }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="text-xl font-semibold">Idea Vault</h1>
        <p className="text-sm text-muted-foreground">
          Guarde qualquer ideia solta antes que ela vire cânone. Clique numa ideia para desenvolvê-la.
        </p>
      </div>

      <QuickAddIdeaForm campaignId={campaignId} />

      <WikiListToolbar
        tags={tags}
        statusOptions={IDEA_STATE_OPTIONS}
        statusParam="state"
        statusLabel="Estado"
        searchPlaceholder="Buscar ideias…"
      />

      {summaries.length === 0 ? (
        <EmptyState message="Nenhuma ideia guardada ainda. Use o campo acima para começar." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summaries.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} campaignId={campaignId} availableTags={tags} />
          ))}
        </div>
      )}
    </div>
  );
}
