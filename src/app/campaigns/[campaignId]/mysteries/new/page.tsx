import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { createMysteryAction } from "@/modules/worldbuilding/mysteries/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { MysteryForm } from "@/components/mysteries/mystery-form";

export const metadata: Metadata = { title: "Novo mistério" };

interface NewMysteryPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function NewMysteryPage({ params }: NewMysteryPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const tags = await listTagsForCampaign(campaignId);
  const action = createMysteryAction.bind(null, campaignId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Novo mistério</h1>
        <p className="text-sm text-muted-foreground">Só o título é obrigatório.</p>
      </div>
      <MysteryForm campaignId={campaignId} action={action} submitLabel="Criar mistério" availableTags={tags} />
    </div>
  );
}
