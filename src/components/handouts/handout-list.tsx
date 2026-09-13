"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";

import type { Handout } from "@/generated/prisma/client";
import { deleteHandoutAction, toggleHandoutRevealedAction } from "@/modules/players/handouts/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

function DeleteHandoutButton({ campaignId, handout }: { campaignId: string; handout: Handout }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Trash2 className="size-4 text-destructive" />
        <span className="sr-only">Excluir handout</span>
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Excluir "${handout.title}"?`}
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={() => deleteHandoutAction(campaignId, handout.id)}
      />
    </>
  );
}

function HandoutCard({ campaignId, handout, canManage }: { campaignId: string; handout: Handout; canManage: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-sm font-medium">{handout.title}</span>
          <Badge variant={handout.revealed ? "secondary" : "outline"}>
            {handout.revealed ? "Revelado" : "Oculto"}
          </Badge>
        </div>
        {canManage && (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="icon"
              variant="secondary"
              disabled={isPending}
              onClick={() => startTransition(() => toggleHandoutRevealedAction(campaignId, handout.id))}
            >
              {handout.revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              <span className="sr-only">{handout.revealed ? "Ocultar" : "Revelar"}</span>
            </Button>
            <DeleteHandoutButton campaignId={campaignId} handout={handout} />
          </div>
        )}
      </div>

      {handout.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- upload local ou Vercel Blob, sem domínio fixo para next/image
        <img src={handout.imageUrl} alt={handout.title} className="max-h-64 w-full rounded-md object-contain" />
      )}
      {handout.content && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{handout.content}</p>}
    </Card>
  );
}

export function HandoutList({
  campaignId,
  handouts,
  canManage,
}: {
  campaignId: string;
  handouts: Handout[];
  canManage: boolean;
}) {
  if (handouts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {canManage ? "Nenhum handout ainda." : "Nenhum handout foi revelado ainda."}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {handouts.map((handout) => (
        <HandoutCard key={handout.id} campaignId={campaignId} handout={handout} canManage={canManage} />
      ))}
    </div>
  );
}
