import { notFound, redirect } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getEnabledModuleKeys } from "@/modules/core/campaigns/module-settings";

interface SystemIndexPageProps {
  params: Promise<{ campaignId: string }>;
}

/** `/system` não tem tela própria — redireciona direto para a primeira aba (Atributos). */
export default async function SystemIndexPage({ params }: SystemIndexPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId);
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const enabledModuleKeys = await getEnabledModuleKeys(campaignId);
  if (!enabledModuleKeys.has("system")) notFound();

  redirect(`/campaigns/${campaignId}/system/attributes`);
}
