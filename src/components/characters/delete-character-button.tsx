"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { deleteCharacterAction } from "@/modules/players/characters/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteCharacterButton({
  campaignId,
  characterId,
  characterName,
}: {
  campaignId: string;
  characterId: string;
  characterName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="size-4 text-destructive" /> Excluir
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Excluir a ficha de "${characterName}"?`}
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={() => deleteCharacterAction(campaignId, characterId)}
      />
    </>
  );
}
