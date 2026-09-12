"use client";

import { useTransition } from "react";
import { Archive, ArchiveRestore } from "lucide-react";

import { archiveCampaignAction, unarchiveCampaignAction } from "@/modules/core/campaigns/actions";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface ArchiveToggleMenuItemProps {
  campaignId: string;
  isArchived: boolean;
}

export function ArchiveToggleMenuItem({ campaignId, isArchived }: ArchiveToggleMenuItemProps) {
  const [isPending, startTransition] = useTransition();

  const Icon = isArchived ? ArchiveRestore : Archive;
  const label = isArchived ? "Desarquivar" : "Arquivar";
  const action = isArchived ? unarchiveCampaignAction : archiveCampaignAction;

  return (
    <DropdownMenuItem
      disabled={isPending}
      onSelect={() => {
        startTransition(() => {
          action(campaignId);
        });
      }}
    >
      <Icon className="size-4" /> {label}
    </DropdownMenuItem>
  );
}
