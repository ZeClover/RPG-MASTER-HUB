import type { ReactNode } from "react";

import type { CampaignRole } from "@/generated/prisma/client";
import { CampaignTopbar } from "@/components/layout/campaign-topbar";
import { CampaignSidebar } from "@/components/layout/campaign-sidebar";
import { CommandPalette } from "@/components/wiki/command-palette";
import type { SessionUserLike } from "@/types/session";

interface CampaignShellProps {
  campaign: { id: string; name: string; iconUrl: string | null };
  user: SessionUserLike;
  role: CampaignRole;
  children: ReactNode;
}

export function CampaignShell({ campaign, user, role, children }: CampaignShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <CampaignTopbar campaign={campaign} user={user} />
      <div className="flex flex-1 flex-col sm:flex-row">
        <CampaignSidebar campaignId={campaign.id} role={role} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <CommandPalette campaignId={campaign.id} />
    </div>
  );
}
