import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listLogEntries } from "@/modules/game/session-log/queries";
import { getCurrentEncounter } from "@/modules/game/combat/queries";
import { listSessionPlans } from "@/modules/preparation/session-plans/queries";
import { SessionModeClient } from "@/components/session-mode/session-mode-client";

export const metadata: Metadata = { title: "Modo Sessão" };

interface SessionModePageProps {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SessionModePage({ params, searchParams }: SessionModePageProps) {
  const { campaignId } = await params;
  const sp = await searchParams;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const sessionPlanId = typeof sp.plan === "string" ? sp.plan : undefined;

  const [logEntries, encounter, sessionPlans] = await Promise.all([
    listLogEntries(user.id, campaignId),
    getCurrentEncounter(user.id, campaignId),
    listSessionPlans(campaignId, { archived: false }),
  ]);

  return (
    <SessionModeClient
      campaignId={campaignId}
      sessionPlanId={sessionPlanId}
      sessionPlans={sessionPlans.map((plan) => ({ id: plan.id, title: plan.title, sessionNumber: plan.sessionNumber }))}
      initialLogEntries={logEntries}
      initialEncounter={encounter}
    />
  );
}
