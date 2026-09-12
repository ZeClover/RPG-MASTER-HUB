"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Minus, Pencil, Plus } from "lucide-react";

import { advanceCalendarDayAction, updateCalendarAction } from "@/modules/worldbuilding/calendar/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CampaignCalendarWidgetProps {
  campaignId: string;
  currentDay: number;
  dayLabel: string;
}

function EditCalendarDialog({ campaignId, currentDay, dayLabel }: CampaignCalendarWidgetProps) {
  const [open, setOpen] = useState(false);
  const action = updateCalendarAction.bind(null, campaignId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.errors) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon">
          <Pencil className="size-4" />
          <span className="sr-only">Editar calendário</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Calendário da campanha</DialogTitle>
          <DialogDescription>
            Um contador simples de &quot;dia atual&quot; — a Fase 5 não assume um calendário fictício específico.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="dayLabel">Rótulo</Label>
            <Input id="dayLabel" name="dayLabel" defaultValue={dayLabel} placeholder="Dia" />
            {state?.errors?.dayLabel && <p className="text-xs text-destructive">{state.errors.dayLabel[0]}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="currentDay">Contador atual</Label>
            <Input id="currentDay" name="currentDay" type="number" min={0} defaultValue={currentDay} />
            {state?.errors?.currentDay && <p className="text-xs text-destructive">{state.errors.currentDay[0]}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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

/**
 * Corte de escopo da Fase 5 (ver ARCHITECTURE.md, seção 16.2): em vez de uma
 * página própria de calendário, o contador de dia vive como um widget no
 * topo da Timeline — os dois conceitos são pequenos o bastante para não
 * justificarem rotas/CRUD separados.
 */
export function CampaignCalendarWidget({ campaignId, currentDay, dayLabel }: CampaignCalendarWidgetProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div>
        <p className="text-xs text-muted-foreground">Calendário da campanha</p>
        <p className="text-lg font-semibold">
          {dayLabel} {currentDay}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={isPending}
          onClick={() => startTransition(() => advanceCalendarDayAction(campaignId, -1))}
        >
          <Minus className="size-4" />
          <span className="sr-only">Voltar um dia</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={isPending}
          onClick={() => startTransition(() => advanceCalendarDayAction(campaignId, 1))}
        >
          <Plus className="size-4" />
          <span className="sr-only">Avançar um dia</span>
        </Button>
        <EditCalendarDialog campaignId={campaignId} currentDay={currentDay} dayLabel={dayLabel} />
      </div>
    </Card>
  );
}
