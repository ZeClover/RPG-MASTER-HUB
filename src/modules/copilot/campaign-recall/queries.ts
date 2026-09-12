import "server-only";

import { db } from "@/lib/db";
import { getEntityHref } from "@/modules/creation/relationships/config";

/**
 * Campaign Recall (Fase 8, ver ARCHITECTURE.md, seção 19.3) — monta uma
 * recapitulação cronológica juntando dados REAIS já registrados pelo mestre
 * (Cenas jogadas, Session Log, eventos de Timeline, Consequências disparadas)
 * no período das N sessões mais recentes. Zero invenção de conteúdo — é
 * template/formatação sobre o que já existe, não um resumo gerado por LLM.
 */

const MAX_SESSION_COUNT = 20;

export type RecallItemKind = "SCENE" | "LOG_ENTRY" | "TIMELINE_EVENT" | "CONSEQUENCE";

export interface RecallItem {
  kind: RecallItemKind;
  at: Date;
  /** Rótulo do tipo de item, ex. "Cena jogada", "Evento da linha do tempo (12 de Chuvamar)". */
  label: string;
  /** Título próprio do item (cena/evento/consequência) — vazio para entradas de Session Log, que não têm título. */
  title: string;
  body: string | null;
  href: string | null;
}

export interface RecallSessionPlanSummary {
  id: string;
  title: string;
  sessionNumber: number | null;
  plannedDate: Date | null;
  href: string;
}

export interface CampaignRecall {
  sessionPlans: RecallSessionPlanSummary[];
  since: Date | null;
  items: RecallItem[];
}

const SESSION_LOG_LABELS: Record<string, string> = {
  NOTE: "Nota de sessão",
  DICE_ROLL: "Rolagem de dados",
  COMBAT_EVENT: "Evento de combate",
};

/**
 * `sessionCount` = "últimas N sessões" (N=1 é "desde a última sessão", o
 * mesmo controle cobre os dois exemplos do pedido original). As N sessões
 * mais recentes (não arquivadas) definem tanto o conjunto de Cenas/Session
 * Log vinculados diretamente a elas quanto o corte de tempo (`since`) usado
 * para Timeline/Consequências, que não têm vínculo direto com uma sessão.
 */
export async function buildCampaignRecall(campaignId: string, sessionCount: number): Promise<CampaignRecall> {
  const count = Math.max(1, Math.min(Math.trunc(sessionCount) || 1, MAX_SESSION_COUNT));

  const recentPlans = await db.sessionPlan.findMany({
    where: { campaignId, archived: false },
    orderBy: [{ sessionNumber: "desc" }, { plannedDate: "desc" }, { createdAt: "desc" }],
    take: count,
    select: { id: true, title: true, sessionNumber: true, plannedDate: true, createdAt: true },
  });

  if (recentPlans.length === 0) {
    return { sessionPlans: [], since: null, items: [] };
  }

  const planIds = recentPlans.map((plan) => plan.id);
  let since = recentPlans[0].plannedDate ?? recentPlans[0].createdAt;
  for (const plan of recentPlans) {
    const anchor = plan.plannedDate ?? plan.createdAt;
    if (anchor < since) since = anchor;
  }

  const [scenes, logEntries, timelineEvents, triggeredConsequences] = await Promise.all([
    db.scene.findMany({
      where: { campaignId, sessionPlanId: { in: planIds }, status: "PLAYED" },
      orderBy: { updatedAt: "asc" },
      select: { title: true, summary: true, updatedAt: true },
    }),
    db.sessionLogEntry.findMany({
      where: {
        campaignId,
        OR: [{ sessionPlanId: { in: planIds } }, { sessionPlanId: null, createdAt: { gte: since } }],
      },
      orderBy: { createdAt: "asc" },
      select: { type: true, content: true, createdAt: true },
    }),
    db.timelineEvent.findMany({
      where: { campaignId, archived: false, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, description: true, narrativeDate: true, createdAt: true },
    }),
    db.consequence.findMany({
      where: { campaignId, status: "TRIGGERED", updatedAt: { gte: since } },
      orderBy: { updatedAt: "asc" },
      select: { id: true, title: true, description: true, updatedAt: true },
    }),
  ]);

  const items: RecallItem[] = [
    ...scenes.map(
      (scene): RecallItem => ({
        kind: "SCENE",
        at: scene.updatedAt,
        label: "Cena jogada",
        title: scene.title,
        body: scene.summary,
        href: null,
      }),
    ),
    ...logEntries.map(
      (entry): RecallItem => ({
        kind: "LOG_ENTRY",
        at: entry.createdAt,
        label: SESSION_LOG_LABELS[entry.type] ?? entry.type,
        title: "",
        body: entry.content,
        href: null,
      }),
    ),
    ...timelineEvents.map(
      (event): RecallItem => ({
        kind: "TIMELINE_EVENT",
        at: event.createdAt,
        label: event.narrativeDate ? `Evento da linha do tempo (${event.narrativeDate})` : "Evento da linha do tempo",
        title: event.title,
        body: event.description,
        href: getEntityHref(campaignId, "TIMELINE_EVENT", event.id),
      }),
    ),
    ...triggeredConsequences.map(
      (consequence): RecallItem => ({
        kind: "CONSEQUENCE",
        at: consequence.updatedAt,
        label: "Consequência disparada",
        title: consequence.title,
        body: consequence.description,
        href: getEntityHref(campaignId, "CONSEQUENCE", consequence.id),
      }),
    ),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  return {
    sessionPlans: recentPlans.map((plan) => ({
      id: plan.id,
      title: plan.title,
      sessionNumber: plan.sessionNumber,
      plannedDate: plan.plannedDate,
      href: `/campaigns/${campaignId}/session-plans/${plan.id}`,
    })),
    since,
    items,
  };
}
