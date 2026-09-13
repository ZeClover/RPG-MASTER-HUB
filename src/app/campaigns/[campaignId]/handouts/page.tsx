import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listHandouts } from "@/modules/players/handouts/queries";
import { HandoutForm } from "@/components/handouts/handout-form";
import { HandoutList } from "@/components/handouts/handout-list";

export const metadata: Metadata = { title: "Handouts" };

interface HandoutsPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function HandoutsPage({ params }: HandoutsPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  let role;
  try {
    ({ role } = await requireCampaignAccess(user.id, campaignId));
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const canManage = role !== "PLAYER";
  const handouts = await listHandouts(user.id, campaignId);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="text-xl font-semibold">Handouts</h1>
        <p className="text-sm text-muted-foreground">
          Documentos e imagens entregues aos jogadores durante a sessão — cartas, mapas, pistas físicas.
        </p>
      </div>

      {canManage && <HandoutForm campaignId={campaignId} />}

      <HandoutList campaignId={campaignId} handouts={handouts} canManage={canManage} />
    </div>
  );
}
