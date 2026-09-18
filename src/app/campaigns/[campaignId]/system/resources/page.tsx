import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getEnabledModuleKeys } from "@/modules/core/campaigns/module-settings";
import { listResources } from "@/modules/gametools/system/queries";
import { SystemTabs } from "@/components/campaigns/system-tabs";
import { ResourceList } from "@/components/system/resource-list";

export const metadata: Metadata = { title: "Recursos" };

interface ResourcesPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function ResourcesPage({ params }: ResourcesPageProps) {
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
  const resources = await listResources(user.id, campaignId);

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
        <h2 className="text-lg font-semibold">Recursos</h2>
        <p className="text-sm text-muted-foreground">
          Recursos consumíveis do sistema (ex.: Pontos de Vida, Pontos de Mana). O valor atual/máximo por
          personagem chega numa fase futura — aqui só o molde da campanha.
        </p>
      </div>

      <ResourceList campaignId={campaignId} resources={resources} canManage={canManage} />
    </div>
  );
}
