import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { updateCampaignAction } from "@/modules/core/campaigns/actions";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { ArchiveCampaignButton } from "@/components/campaigns/archive-campaign-button";
import { SettingsTabs } from "@/components/campaigns/settings-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Configurações da campanha" };

interface SettingsPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function CampaignSettingsPage({ params }: SettingsPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  let campaign;
  try {
    ({ campaign } = await requireCampaignAccess(user.id, campaignId, "OWNER"));
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const boundUpdateAction = updateCampaignAction.bind(null, campaignId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="text-xl font-semibold">Configurações da campanha</h1>
        <p className="text-sm text-muted-foreground">Ajuste identidade, imagens e informações básicas.</p>
      </div>

      <SettingsTabs campaignId={campaignId} />

      <CampaignForm
        action={boundUpdateAction}
        campaignId={campaignId}
        submitLabel="Salvar alterações"
        defaultValues={campaign}
      />

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de risco</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4 pt-0">
          <p className="text-sm text-muted-foreground">
            Arquivar remove a campanha da lista principal sem apagar nenhum dado.
          </p>
          <ArchiveCampaignButton campaignId={campaignId} campaignName={campaign.name} />
        </CardContent>
      </Card>
    </div>
  );
}
