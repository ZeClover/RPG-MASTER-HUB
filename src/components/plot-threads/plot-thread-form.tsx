"use client";

import { useActionState } from "react";

import type { PlotThreadStatus, RelationshipImportance, Visibility } from "@/generated/prisma/client";
import type { PlotThreadFormState } from "@/modules/preparation/plot-threads/actions";
import { RELATIONSHIP_IMPORTANCE_LABELS } from "@/modules/creation/relationships/config";
import { PLOT_THREAD_STATUS_OPTIONS } from "@/components/wiki/status-config";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VisibilityField } from "@/components/wiki/visibility-field";
import { TagPicker, type TagOption } from "@/components/wiki/tag-picker";

const RELATIONSHIP_IMPORTANCE_OPTIONS = Object.entries(RELATIONSHIP_IMPORTANCE_LABELS) as [
  RelationshipImportance,
  string,
][];

export interface PlotThreadFormDefaultValues {
  title?: string;
  description?: string | null;
  status?: PlotThreadStatus;
  importance?: RelationshipImportance;
  visibility?: Visibility;
}

interface PlotThreadFormProps {
  campaignId: string;
  action: (state: PlotThreadFormState, formData: FormData) => Promise<PlotThreadFormState>;
  submitLabel: string;
  defaultValues?: PlotThreadFormDefaultValues;
  availableTags: TagOption[];
  defaultSelectedTagIds?: string[];
}

export function PlotThreadForm({
  campaignId,
  action,
  submitLabel,
  defaultValues,
  availableTags,
  defaultSelectedTagIds,
}: PlotThreadFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.message && (
        <p className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm">{state.message}</p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" required defaultValue={defaultValues?.title} placeholder="Título da trama" />
        {state?.errors?.title && <p className="text-xs text-destructive">{state.errors.title[0]}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" rows={5} defaultValue={defaultValues?.description ?? ""} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={defaultValues?.status ?? "ACTIVE"}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLOT_THREAD_STATUS_OPTIONS.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="importance">Importância</Label>
          <Select name="importance" defaultValue={defaultValues?.importance ?? "MEDIUM"}>
            <SelectTrigger id="importance">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIP_IMPORTANCE_OPTIONS.map(([value, label]) => (
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
