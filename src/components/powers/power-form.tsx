"use client";

import { useActionState } from "react";

import type { CanonStatus, Visibility } from "@/generated/prisma/client";
import type { PowerFormState } from "@/modules/gametools/powers/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CanonStatusField } from "@/components/wiki/canon-status-field";
import { VisibilityField } from "@/components/wiki/visibility-field";
import { TagPicker, type TagOption } from "@/components/wiki/tag-picker";

const COST_SUGGESTIONS = ["1 PM", "2 PM", "Ação", "Ação bônus", "Reação", "1x por sessão", "Grátis"];

export interface PowerFormDefaultValues {
  name?: string;
  cost?: string | null;
  description?: string | null;
  effect?: string | null;
  canonStatus?: CanonStatus;
  visibility?: Visibility;
}

interface PowerFormProps {
  campaignId: string;
  action: (state: PowerFormState, formData: FormData) => Promise<PowerFormState>;
  submitLabel: string;
  defaultValues?: PowerFormDefaultValues;
  availableTags: TagOption[];
  defaultSelectedTagIds?: string[];
}

export function PowerForm({
  campaignId,
  action,
  submitLabel,
  defaultValues,
  availableTags,
  defaultSelectedTagIds,
}: PowerFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.message && (
        <p className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm">{state.message}</p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required defaultValue={defaultValues?.name} placeholder="Nome do poder" />
        {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cost">Custo</Label>
        <Input
          id="cost"
          name="cost"
          list="power-cost-suggestions"
          defaultValue={defaultValues?.cost ?? ""}
          placeholder="Ex.: 2 PM, Ação bônus…"
        />
        <datalist id="power-cost-suggestions">
          {COST_SUGGESTIONS.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
          placeholder="Como o poder se manifesta narrativamente…"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="effect">Efeito</Label>
        <Textarea
          id="effect"
          name="effect"
          rows={3}
          defaultValue={defaultValues?.effect ?? ""}
          placeholder="O que o poder faz mecanicamente…"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CanonStatusField defaultValue={defaultValues?.canonStatus} />
        <VisibilityField defaultValue={defaultValues?.visibility} />
      </div>

      <TagPicker campaignId={campaignId} availableTags={availableTags} defaultSelectedTagIds={defaultSelectedTagIds} />

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
