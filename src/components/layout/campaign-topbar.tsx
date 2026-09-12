import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { UserMenu } from "@/components/layout/user-menu";
import { SyncStatusIndicator } from "@/components/layout/sync-status-indicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SessionUserLike } from "@/types/session";

interface CampaignTopbarProps {
  campaign: { id: string; name: string; iconUrl: string | null };
  user: SessionUserLike;
}

export function CampaignTopbar({ campaign, user }: CampaignTopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/home"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <Avatar className="size-8 rounded-lg">
          {campaign.iconUrl ? <AvatarImage src={campaign.iconUrl} alt="" /> : null}
          <AvatarFallback className="rounded-lg">{campaign.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-semibold">{campaign.name}</span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <SyncStatusIndicator />
        <UserMenu name={user.name} email={user.email} image={user.image} />
      </div>
    </header>
  );
}
