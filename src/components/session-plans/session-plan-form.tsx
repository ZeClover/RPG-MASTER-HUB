"use client";

import { useActionState } from "react";

import type { SessionPlanStatus } from "@/generated/prisma/client";
import type { SessionPlanFormState } from "@/modules/preparation/session-plans/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SESSION_PLAN_STATUS_OPTIONS } from "@/components/wiki/status-config";

export interface SessionPlanFormDefaultValues {
  title?: string;
  sessionNumber?: number | null;
  plannedDate?: Date | null;
  pitch?: string | null;
  gmNotes?: string | null;
  status?: SessionPlanStatus;
}

interface SessionPlanFormProps {
  action: (state: SessionPlanFormState, formData: FormData) => Promise<SessionPlanFormState>;
  submitLabel: string;
  defaultValues?: SessionPlanFormDefaultValues;
}

function toDateInputValue(date?: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function SessionPlanForm({ action, submitLabel, defaultValues }: SessionPlanFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.message && (
        <p className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm">{state.message}</p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={defaultValues?.title}
          placeholder="Ex: Sessão 12 — A queda de Velkar"
        />
        {state?.errors?.title && <p className="text-xs text-destructive">{state.errors.title[0]}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="sessionNumber">Número da sessão</Label>
          <Input
            id="sessionNumber"
            name="sessionNumber"
            type="number"
            min={1}
            defaultValue={defaultValues?.sessionNumber ?? ""}
          />
          {state?.errors?.sessionNumber && <p className="text-xs text-destructive">{state.errors.sessionNumber[0]}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="plannedDate">Data planejada</Label>
          <Input
            id="plannedDate"
            name="plannedDate"
            type="date"
            defaultValue={toDateInputValue(defaultValues?.plannedDate)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pitch">Do que se trata</Label>
        <Textarea
          id="pitch"
          name="pitch"
          rows={2}
          defaultValue={defaultValues?.pitch ?? ""}
          placeholder="Um resumo de uma linha do que deve acontecer nesta sessão."
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="gmNotes">Notas do mestre</Label>
        <Textarea id="gmNotes" name="gmNotes" rows={5} defaultValue={defaultValues?.gmNotes ?? ""} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue={defaultValues?.status ?? "PLANNING"}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SESSION_PLAN_STATUS_OPTIONS.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
