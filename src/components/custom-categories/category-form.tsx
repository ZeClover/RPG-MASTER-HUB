"use client";

import { useActionState } from "react";

import type { CustomCategoryFormState } from "@/modules/gametools/custom-categories/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export interface CategoryFormDefaultValues {
  name?: string;
  description?: string | null;
}

interface CategoryFormProps {
  action: (state: CustomCategoryFormState, formData: FormData) => Promise<CustomCategoryFormState>;
  submitLabel: string;
  defaultValues?: CategoryFormDefaultValues;
  namePlaceholder?: string;
}

export function CategoryForm({ action, submitLabel, defaultValues, namePlaceholder }: CategoryFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.message && (
        <p className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm">{state.message}</p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          placeholder={namePlaceholder ?? "Ex.: Matéria Escolar, Artes Importantes…"}
        />
        {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={defaultValues?.description ?? ""} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
