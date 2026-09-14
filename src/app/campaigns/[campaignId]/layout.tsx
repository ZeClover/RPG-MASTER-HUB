import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { getCampaignForUser } from "@/modules/core/campaigns/queries";
import { getEnabledModuleKeys } from "@/modules/core/campaigns/module-settings";
import { CampaignAccessError } from "@/modules/core/permissions";
import { CampaignShell } from "@/components/layout/campaign-shell";

interface CampaignLayoutProps {
  children: ReactNode;
  params: Promise<{ campaignId: string }>;
}

export default async function CampaignLayout({ children, params }: CampaignLayoutProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  let campaign, role;
  try {
    ({ campaign, role } = await getCampaignForUser(user.id, campaignId));
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const enabledModuleKeys = Array.from(await getEnabledModuleKeys(campaignId));

  return (
    <CampaignShell campaign={campaign} user={user} role={role} enabledModuleKeys={enabledModuleKeys}>
      {children}
    </CampaignShell>
  );
}
