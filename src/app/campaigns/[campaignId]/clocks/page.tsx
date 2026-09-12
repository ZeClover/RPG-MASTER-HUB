import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listNarrativeClocks } from "@/modules/worldbuilding/clocks/queries";
import { AddClockForm } from "@/components/clocks/add-clock-form";
import { ClockCard } from "@/components/clocks/clock-card";
import { EmptyState } from "@/components/wiki/empty-state";

export const metadata: Metadata = { title: "Relógios Narrativos" };

interface ClocksPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function ClocksPage({ params }: ClocksPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId);
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const clocks = await listNarrativeClocks(campaignId);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="text-xl font-semibold">Relógios Narrativos</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe o progresso de ameaças e objetivos em segmentos, no padrão Powered by the Apocalypse/Blades in
          the Dark.
        </p>
      </div>

      <AddClockForm campaignId={campaignId} />

      {clocks.length === 0 ? (
        <EmptyState message="Nenhum relógio criado ainda." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {clocks.map((clock) => (
            <ClockCard key={clock.id} campaignId={campaignId} clock={clock} />
          ))}
        </div>
      )}
    </div>
  );
}
