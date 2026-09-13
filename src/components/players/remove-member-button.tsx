"use client";

import { useState } from "react";
import { UserMinus } from "lucide-react";

import { removeCampaignMemberAction } from "@/modules/players/members/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function RemoveMemberButton({
  campaignId,
  memberId,
  memberLabel,
}: {
  campaignId: string;
  memberId: string;
  memberLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label={`Remover ${memberLabel}`}>
        <UserMinus className="size-4" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Remover ${memberLabel}?`}
        description="A pessoa perde acesso a esta campanha imediatamente. Pode ser adicionada de novo depois, se precisar."
        confirmLabel="Remover"
        onConfirm={() => removeCampaignMemberAction(campaignId, memberId)}
      />
    </>
  );
}
