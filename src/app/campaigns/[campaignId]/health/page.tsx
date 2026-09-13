import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Activity, Compass, Moon, ScrollText, Search, Users } from "lucide-react";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import {
  STALE_DAYS,
  getArchiveRatioBreakdown,
  listDormantPlotThreads,
  listOrphanContent,
  listStaleActiveQuests,
  listStaleOpenMysteries,
  listStuckInDraft,
} from "@/modules/intelligence/health/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthSection } from "@/components/intelligence/health-section";
import { ArchiveRatioTable } from "@/components/intelligence/archive-ratio-table";

export const metadata: Metadata = { title: "Campaign Health" };

interface CampaignHealthPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function CampaignHealthPage({ params }: CampaignHealthPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const [staleQuests, dormantThreads, staleMysteries, stuckDraft, orphans, archiveRatio] = await Promise.all([
    listStaleActiveQuests(campaignId),
    listDormantPlotThreads(campaignId),
    listStaleOpenMysteries(campaignId),
    listStuckInDraft(campaignId),
    listOrphanContent(campaignId),
    getArchiveRatioBreakdown(campaignId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center gap-2">
        <Activity className="size-5 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">Campaign Health</h1>
          <p className="text-sm text-muted-foreground">
            Diagnóstico honesto, sem nota única inventada — listas categorizadas do que pode precisar de atenção.
            &ldquo;Parado&rdquo; aqui significa sem edição há mais de {STALE_DAYS} dias.
          </p>
        </div>
      </div>

      <HealthSection
        title="Missões travadas"
        description={`Ativas, mas sem atualização há mais de ${STALE_DAYS} dias.`}
        icon={<ScrollText className="size-4 text-muted-foreground" />}
        rows={staleQuests}
        emptyMessage="Nenhuma missão ativa parada."
      />

      <HealthSection
        title="Tramas dormentes"
        description="Marcadas como Dormente — considere resolvê-las ou reativá-las."
        icon={<Moon className="size-4 text-muted-foreground" />}
        rows={dormantThreads}
        emptyMessage="Nenhuma trama dormente."
      />

      <HealthSection
        title="Mistérios esquecidos"
        description={`Abertos, mas sem atualização há mais de ${STALE_DAYS} dias.`}
        icon={<Search className="size-4 text-muted-foreground" />}
        rows={staleMysteries}
        emptyMessage="Nenhum mistério aberto parado."
      />

      <HealthSection
        title="Preso em rascunho"
        description={`Rascunho ou Proposto há mais de ${STALE_DAYS} dias — talvez precise de uma decisão da mesa.`}
        icon={<Compass className="size-4 text-muted-foreground" />}
        rows={stuckDraft}
        emptyMessage="Nada parado em rascunho/proposto."
      />

      <HealthSection
        title="Conteúdo órfão"
        description="Sem nenhum Relacionamento registrado — pode estar desconectado do resto da campanha."
        icon={<Users className="size-4 text-muted-foreground" />}
        rows={orphans}
        emptyMessage="Tudo tem pelo menos uma relação registrada."
      />

      <Card>
        <CardHeader>
          <CardTitle>Arquivado vs. ativo</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ArchiveRatioTable rows={archiveRatio} />
        </CardContent>
      </Card>
    </div>
  );
}
