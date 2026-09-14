"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { deleteCategoryAction } from "@/modules/gametools/custom-categories/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteCategoryButton({
  campaignId,
  categoryId,
  categoryName,
}: {
  campaignId: string;
  categoryId: string;
  categoryName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="size-4 text-destructive" /> Excluir categoria
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Excluir "${categoryName}"?`}
        description="Esta ação não pode ser desfeita. Todas as entradas desta categoria também serão removidas."
        confirmLabel="Excluir"
        onConfirm={() => deleteCategoryAction(campaignId, categoryId)}
      />
    </>
  );
}
