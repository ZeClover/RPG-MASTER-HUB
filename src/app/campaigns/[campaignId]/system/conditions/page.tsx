import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getEnabledModuleKeys } from "@/modules/core/campaigns/module-settings";
import { listConditions } from "@/modules/gametools/system/queries";
import { SystemTabs } from "@/components/campaigns/system-tabs";
import { ConditionList } from "@/components/system/condition-list";

export const metadata: Metadata = { title: "Condições" };

interface ConditionsPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function ConditionsPage({ params }: ConditionsPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  let membership;
  try {
    membership = await requireCampaignAccess(user.id, campaignId);
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const enabledModuleKeys = await getEnabledModuleKeys(campaignId);
  if (!enabledModuleKeys.has("system")) notFound();

  const canManage = membership.role !== "PLAYER";
  const conditions = await listConditions(user.id, campaignId);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="text-xl font-semibold">Construtor de Sistema</h1>
        <p className="text-sm text-muted-foreground">
          Atributos, recursos, perícias, condições e fórmulas de rolagem do sistema de jogo desta campanha.
        </p>
      </div>

      <SystemTabs campaignId={campaignId} />

      <div>
        <h2 className="text-lg font-semibold">Condições</h2>
        <p className="text-sm text-muted-foreground">
          Catálogo de condições/status que podem ser aplicados a um personagem (ex.: Envenenado, Atordoado).
        </p>
      </div>

      <ConditionList campaignId={campaignId} conditions={conditions} canManage={canManage} />
    </div>
  );
}
