import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getSessionPlanForUser } from "@/modules/preparation/session-plans/queries";
import { updateSessionPlanAction } from "@/modules/preparation/session-plans/actions";
import { SessionPlanForm } from "@/components/session-plans/session-plan-form";

export const metadata: Metadata = { title: "Editar sessão" };

interface EditSessionPlanPageProps {
  params: Promise<{ campaignId: string; sessionPlanId: string }>;
}

export default async function EditSessionPlanPage({ params }: EditSessionPlanPageProps) {
  const { campaignId, sessionPlanId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const sessionPlan = await getSessionPlanForUser(user.id, campaignId, sessionPlanId);
  if (!sessionPlan) notFound();

  const action = updateSessionPlanAction.bind(null, campaignId, sessionPlanId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Editar {sessionPlan.title}</h1>
      </div>
      <SessionPlanForm action={action} submitLabel="Salvar alterações" defaultValues={sessionPlan} />
    </div>
  );
}
