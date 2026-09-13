import type { Metadata } from "next";
import { Archive } from "lucide-react";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listArchivedContent } from "@/modules/intelligence/graveyard/queries";
import { EmptyState } from "@/components/wiki/empty-state";
import { GraveyardItemRow } from "@/components/intelligence/graveyard-item-row";

export const metadata: Metadata = { title: "Content Graveyard" };

interface ContentGraveyardPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function ContentGraveyardPage({ params }: ContentGraveyardPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const items = await listArchivedContent(campaignId);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center gap-2">
        <Archive className="size-5 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">Content Graveyard</h1>
          <p className="text-sm text-muted-foreground">
            Todo conteúdo arquivado da campanha, de todos os tipos, num só lugar — desarquive ou exclua para sempre.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState message="Nada arquivado. Conteúdo arquivado de qualquer tipo (NPCs, Locais, Missões, Monstros...) aparece aqui." />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <GraveyardItemRow key={`${item.type}-${item.id}`} campaignId={campaignId} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
