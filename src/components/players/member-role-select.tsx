"use client";

import { useState, useTransition } from "react";

import { updateCampaignMemberRoleAction } from "@/modules/players/members/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function MemberRoleSelect({
  campaignId,
  memberId,
  role,
}: {
  campaignId: string;
  memberId: string;
  role: "CO_GM" | "PLAYER";
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Select
        value={role}
        disabled={isPending}
        onValueChange={(next) =>
          startTransition(async () => {
            setError(null);
            const result = await updateCampaignMemberRoleAction(campaignId, memberId, next);
            if (result?.error) setError(result.error);
          })
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PLAYER">Jogador</SelectItem>
          <SelectItem value="CO_GM">Co-Mestre</SelectItem>
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
