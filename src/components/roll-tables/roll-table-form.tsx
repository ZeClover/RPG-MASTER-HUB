"use client";

import { useActionState } from "react";

import type { RollTableFormState } from "@/modules/gametools/roll-tables/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface RollTableFormDefaultValues {
  name?: string;
  description?: string | null;
}

interface RollTableFormProps {
  action: (state: RollTableFormState, formData: FormData) => Promise<RollTableFormState>;
  submitLabel: string;
  defaultValues?: RollTableFormDefaultValues;
  namePlaceholder: string;
}

export function RollTableForm({ action, submitLabel, defaultValues, namePlaceholder }: RollTableFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.message && (
        <p className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm">{state.message}</p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required defaultValue={defaultValues?.name} placeholder={namePlaceholder} />
        {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
          placeholder="Quando/como usar esta tabela…"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
