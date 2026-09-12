"use client";

import { useActionState, useEffect, useRef } from "react";

import type { NarrativeClock } from "@/generated/prisma/client";
import { updateClockAction } from "@/modules/worldbuilding/clocks/actions";
import { CLOCK_SEGMENT_OPTIONS } from "@/modules/worldbuilding/clocks/schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ClockEditDialogProps {
  campaignId: string;
  clock: NarrativeClock;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClockEditDialog({ campaignId, clock, open, onOpenChange }: ClockEditDialogProps) {
  const action = updateClockAction.bind(null, campaignId, clock.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.errors && !state?.message) {
      onOpenChange(false);
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reagir a pending/state, onOpenChange é estável o bastante
  }, [pending, state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar relógio</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {state?.message && <p className="text-sm text-destructive">{state.message}</p>}

          <div className="flex flex-col gap-2">
            <Label htmlFor={`title-${clock.id}`}>Título</Label>
            <Input id={`title-${clock.id}`} name="title" required defaultValue={clock.title} />
            {state?.errors?.title && <p className="text-xs text-destructive">{state.errors.title[0]}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`description-${clock.id}`}>Descrição</Label>
            <Textarea
              id={`description-${clock.id}`}
              name="description"
              rows={2}
              defaultValue={clock.description ?? ""}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`segments-${clock.id}`}>Segmentos</Label>
            <Select name="segments" defaultValue={String(clock.segments)}>
              <SelectTrigger id={`segments-${clock.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLOCK_SEGMENT_OPTIONS.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value} segmentos
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Diminuir os segmentos limita automaticamente os preenchidos ao novo total.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
