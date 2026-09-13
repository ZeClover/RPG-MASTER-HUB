import type { Metadata } from "next";
import { Shuffle } from "lucide-react";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { loadEntityPool } from "@/modules/copilot/consequence-suggester/queries";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { createConsequenceAction } from "@/modules/preparation/consequences/actions";
import { ConsequenceSuggesterView } from "@/components/copilot/consequence-suggester-view";

export const metadata: Metadata = { title: "Consequence Suggester" };

interface ConsequenceSuggesterPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function ConsequenceSuggesterPage({ params }: ConsequenceSuggesterPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const [pool, tags] = await Promise.all([loadEntityPool(campaignId), listTagsForCampaign(campaignId)]);
  const action = createConsequenceAction.bind(null, campaignId);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center gap-2">
        <Shuffle className="size-5 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">Consequence Suggester</h1>
          <p className="text-sm text-muted-foreground">
            Gerador combinatório de consequências — sorteia entre 120 templates (política, pessoal,
            ambiental, sobrenatural, econômica, militar) e preenche com NPCs/Facções/Locais/Itens reais da
            campanha. Puramente aleatório, sem IA — o mestre decide o que vale a pena guardar.
          </p>
        </div>
      </div>

      <ConsequenceSuggesterView campaignId={campaignId} pool={pool} tags={tags} action={action} />
    </div>
  );
}
