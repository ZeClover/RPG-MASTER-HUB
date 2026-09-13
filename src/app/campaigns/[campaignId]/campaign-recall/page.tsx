import type { Metadata } from "next";
import Link from "next/link";
import { NotebookText } from "lucide-react";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { buildCampaignRecall } from "@/modules/copilot/campaign-recall/queries";
import { formatRecallAsText } from "@/modules/copilot/campaign-recall/formatter";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecallSessionCountPicker } from "@/components/copilot/recall-session-count-picker";
import { RecallTimeline } from "@/components/copilot/recall-timeline";
import { CopyRecallButton } from "@/components/copilot/copy-recall-button";

export const metadata: Metadata = { title: "Campaign Recall" };

interface CampaignRecallPageProps {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CampaignRecallPage({ params, searchParams }: CampaignRecallPageProps) {
  const { campaignId } = await params;
  const sp = await searchParams;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const rawSessions = typeof sp.sessions === "string" ? Number.parseInt(sp.sessions, 10) : 1;
  const sessionCount = Number.isFinite(rawSessions) && rawSessions > 0 ? rawSessions : 1;

  const recall = await buildCampaignRecall(campaignId, sessionCount);
  const recallText = formatRecallAsText(recall);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center gap-2">
        <NotebookText className="size-5 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">Campaign Recall</h1>
          <p className="text-sm text-muted-foreground">
            Recapitulação montada por template a partir de dados que você já registrou (Cenas jogadas, Session
            Log, Timeline, Consequências) — nada inventado, só organizado cronologicamente.
          </p>
        </div>
      </div>

      <RecallSessionCountPicker current={sessionCount} />

      {recall.sessionPlans.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma sessão registrada ainda nesta campanha —{" "}
          <Link href={`/campaigns/${campaignId}/session-plans/new`} className="underline">
            crie uma Sessão
          </Link>{" "}
          para começar a gerar recapitulações.
        </p>
      ) : (
        <>
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>
                  {recall.sessionPlans.length === 1 ? "Desde a última sessão" : `Últimas ${recall.sessionPlans.length} sessões`}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {recall.sessionPlans.map((plan) => (plan.sessionNumber ? `Sessão ${plan.sessionNumber} — ${plan.title}` : plan.title)).join(", ")}
                  {recall.since && ` · a partir de ${formatDate(recall.since)}`}
                </p>
              </div>
              <CopyRecallButton text={recallText} />
            </CardHeader>
            <CardContent className="pt-0">
              <RecallTimeline
                items={recall.items}
                emptyMessage="Nada registrado nesse período ainda (Cenas, Session Log, Timeline ou Consequências)."
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
