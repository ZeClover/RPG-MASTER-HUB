import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { createSessionPlanAction } from "@/modules/preparation/session-plans/actions";
import { SessionPlanForm } from "@/components/session-plans/session-plan-form";

export const metadata: Metadata = { title: "Nova sessão" };

interface NewSessionPlanPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function NewSessionPlanPage({ params }: NewSessionPlanPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const action = createSessionPlanAction.bind(null, campaignId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Nova sessão</h1>
        <p className="text-sm text-muted-foreground">Só o título é obrigatório — adicione cenas e checklist depois.</p>
      </div>
      <SessionPlanForm action={action} submitLabel="Criar sessão" />
    </div>
  );
}
