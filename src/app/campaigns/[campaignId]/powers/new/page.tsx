import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { createPowerAction } from "@/modules/gametools/powers/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { PowerForm } from "@/components/powers/power-form";

export const metadata: Metadata = { title: "Novo poder" };

interface NewPowerPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function NewPowerPage({ params }: NewPowerPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const tags = await listTagsForCampaign(campaignId);
  const action = createPowerAction.bind(null, campaignId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Novo poder</h1>
        <p className="text-sm text-muted-foreground">Só o nome é obrigatório.</p>
      </div>
      <PowerForm campaignId={campaignId} action={action} submitLabel="Criar poder" availableTags={tags} />
    </div>
  );
}
