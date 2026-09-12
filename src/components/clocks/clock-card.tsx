"use client";

import { useState, useTransition } from "react";
import { ArchiveRestore, Archive, Minus, Pencil, Plus, Trash2 } from "lucide-react";

import type { NarrativeClock } from "@/generated/prisma/client";
import {
  deleteClockAction,
  setClockFilledAction,
  toggleClockArchivedAction,
  toggleClockFavoriteAction,
} from "@/modules/worldbuilding/clocks/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { ClockFace } from "@/components/clocks/clock-face";
import { ClockEditDialog } from "@/components/clocks/clock-edit-dialog";

export function ClockCard({ campaignId, clock }: { campaignId: string; clock: NarrativeClock }) {
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isComplete = clock.filled >= clock.segments;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <ClockFace segments={clock.segments} filled={clock.filled} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{clock.title}</h3>
          {clock.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{clock.description}</p>}
          {isComplete && <p className="mt-1 text-xs font-medium text-accent">Completo!</p>}
        </div>
        <FavoriteButton
          favorite={clock.favorite}
          action={() => toggleClockFavoriteAction(campaignId, clock.id)}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isPending || clock.filled === 0}
            onClick={() => startTransition(() => setClockFilledAction(campaignId, clock.id, -1))}
          >
            <Minus className="size-4" />
            <span className="sr-only">Diminuir preenchido</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isPending || clock.filled >= clock.segments}
            onClick={() => startTransition(() => setClockFilledAction(campaignId, clock.id, 1))}
          >
            <Plus className="size-4" />
            <span className="sr-only">Aumentar preenchido</span>
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            <span className="sr-only">Editar relógio</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => startTransition(() => toggleClockArchivedAction(campaignId, clock.id))}
          >
            {clock.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
            <span className="sr-only">{clock.archived ? "Desarquivar" : "Arquivar"}</span>
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4 text-destructive" />
            <span className="sr-only">Excluir relógio</span>
          </Button>
        </div>
      </div>

      <ClockEditDialog campaignId={campaignId} clock={clock} open={editOpen} onOpenChange={setEditOpen} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Excluir "${clock.title}"?`}
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={() => deleteClockAction(campaignId, clock.id)}
      />
    </Card>
  );
}
