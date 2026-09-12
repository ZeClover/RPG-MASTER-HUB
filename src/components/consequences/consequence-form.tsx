"use client";

import { useActionState } from "react";

import type { ConsequenceStatus, Visibility } from "@/generated/prisma/client";
import type { ConsequenceFormState } from "@/modules/preparation/consequences/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONSEQUENCE_STATUS_OPTIONS } from "@/components/wiki/status-config";
import { VisibilityField } from "@/components/wiki/visibility-field";
import { TagPicker, type TagOption } from "@/components/wiki/tag-picker";

export interface ConsequenceFormDefaultValues {
  title?: string;
  trigger?: string | null;
  description?: string | null;
  status?: ConsequenceStatus;
  visibility?: Visibility;
}

interface ConsequenceFormProps {
  campaignId: string;
  action: (state: ConsequenceFormState, formData: FormData) => Promise<ConsequenceFormState>;
  submitLabel: string;
  defaultValues?: ConsequenceFormDefaultValues;
  availableTags: TagOption[];
  defaultSelectedTagIds?: string[];
}

export function ConsequenceForm({
  campaignId,
  action,
  submitLabel,
  defaultValues,
  availableTags,
  defaultSelectedTagIds,
}: ConsequenceFormProps) {
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
          placeholder="Ex: A guarda passa a patrulhar o mercado"
        />
        {state?.errors?.title && <p className="text-xs text-destructive">{state.errors.title[0]}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="trigger">O que causou isso?</Label>
        <Textarea id="trigger" name="trigger" rows={2} defaultValue={defaultValues?.trigger ?? ""} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={defaultValues?.description ?? ""} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={defaultValues?.status ?? "PENDING"}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONSEQUENCE_STATUS_OPTIONS.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
