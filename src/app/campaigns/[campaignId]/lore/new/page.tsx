import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { createLorePageAction } from "@/modules/creation/lore/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { LoreForm } from "@/components/lore/lore-form";

export const metadata: Metadata = { title: "Nova página de lore" };

interface NewLorePageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function NewLorePage({ params }: NewLorePageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const tags = await listTagsForCampaign(campaignId);
  const action = createLorePageAction.bind(null, campaignId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Nova página de lore</h1>
        <p className="text-sm text-muted-foreground">Só o título é obrigatório.</p>
      </div>
      <LoreForm campaignId={campaignId} action={action} submitLabel="Criar página" availableTags={tags} />
    </div>
  );
}
