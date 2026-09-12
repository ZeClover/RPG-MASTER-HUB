import { formatDate, formatDateTime } from "@/lib/format";
import type { CampaignRecall, RecallSessionPlanSummary } from "@/modules/copilot/campaign-recall/queries";

/**
 * Formatação pura (sem acesso a banco) do resultado de `buildCampaignRecall`
 * em texto corrido, pronto para copiar/colar (Discord, bloco de notas antes
 * da mesa) — mesma filosofia de `lore-guardian/heuristics.ts`: testável
 * isoladamente, sem I/O. Nunca inventa uma palavra que não esteja nos dados.
 */

function describeSessionPlan(plan: RecallSessionPlanSummary): string {
  return plan.sessionNumber ? `Sessão ${plan.sessionNumber} — ${plan.title}` : plan.title;
}

export function formatRecallAsText(recall: CampaignRecall): string {
  const lines: string[] = ["RECAPITULAÇÃO DA CAMPANHA", ""];

  if (recall.sessionPlans.length === 0) {
    lines.push("Nenhuma sessão registrada ainda nesta campanha.");
    return lines.join("\n");
  }

  lines.push(`Sessões incluídas: ${recall.sessionPlans.map(describeSessionPlan).join(", ")}`);
  if (recall.since) lines.push(`Período: a partir de ${formatDate(recall.since)}`);
  lines.push("");

  if (recall.items.length === 0) {
    lines.push("Nada registrado nesse período ainda (Cenas, Session Log, Timeline ou Consequências).");
    return lines.join("\n");
  }

  for (const item of recall.items) {
    const when = formatDateTime(item.at);
    const heading = item.title ? `${item.label}: "${item.title}"` : item.label;
    lines.push(`[${when}] ${heading}${item.body ? ` — ${item.body}` : ""}`);
  }

  return lines.join("\n");
}
