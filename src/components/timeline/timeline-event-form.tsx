"use client";

import { useActionState } from "react";

import type { Visibility } from "@/generated/prisma/client";
import type { TimelineEventFormState } from "@/modules/worldbuilding/timeline/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { VisibilityField } from "@/components/wiki/visibility-field";
import { TagPicker, type TagOption } from "@/components/wiki/tag-picker";

export interface TimelineEventFormDefaultValues {
  title?: string;
  narrativeDate?: string | null;
  description?: string | null;
  visibility?: Visibility;
}

interface TimelineEventFormProps {
  campaignId: string;
  action: (state: TimelineEventFormState, formData: FormData) => Promise<TimelineEventFormState>;
  submitLabel: string;
  defaultValues?: TimelineEventFormDefaultValues;
  availableTags: TagOption[];
  defaultSelectedTagIds?: string[];
}

export function TimelineEventForm({
  campaignId,
  action,
  submitLabel,
  defaultValues,
  availableTags,
  defaultSelectedTagIds,
}: TimelineEventFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.message && (
        <p className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm">{state.message}</p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" required defaultValue={defaultValues?.title} placeholder="O que aconteceu?" />
        {state?.errors?.title && <p className="text-xs text-destructive">{state.errors.title[0]}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="narrativeDate">Data narrativa</Label>
        <Input
          id="narrativeDate"
          name="narrativeDate"
          defaultValue={defaultValues?.narrativeDate ?? ""}
          placeholder="Ex: Dia 12, Ano do Dragão · Verão de 1198 · Terceira Era"
        />
        <p className="text-xs text-muted-foreground">
          Texto livre — cada mesa usa o calendário do seu próprio mundo. A ordem exibida na lista é controlada pelas
          setas de mover, não por esta data.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={defaultValues?.description ?? ""} />
      </div>

      <VisibilityField defaultValue={defaultValues?.visibility} />

      <TagPicker campaignId={campaignId} availableTags={availableTags} defaultSelectedTagIds={defaultSelectedTagIds} />

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
