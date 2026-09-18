import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getEnabledModuleKeys } from "@/modules/core/campaigns/module-settings";
import { listSheetSections } from "@/modules/gametools/system/queries";
import { SystemTabs } from "@/components/campaigns/system-tabs";
import { SheetSectionList } from "@/components/system/sheet-section-list";

export const metadata: Metadata = { title: "Ficha" };

interface SheetPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function SheetPage({ params }: SheetPageProps) {
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
  const sections = await listSheetSections(user.id, campaignId);

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
        <h2 className="text-lg font-semibold">Ficha</h2>
        <p className="text-sm text-muted-foreground">
          O layout da ficha única desta campanha — uma seção por bloco (Atributos, Recursos, Perícias,
          Condições, Fórmulas, ou texto livre). Ainda não é a ficha de um personagem: isso chega numa fase
          futura, quando as fichas passam a ser preenchidas por jogador.
        </p>
      </div>

      <SheetSectionList campaignId={campaignId} sections={sections} canManage={canManage} />
    </div>
  );
}
