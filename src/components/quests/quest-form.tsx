"use client";

import { useActionState } from "react";

import type { QuestStatus, Visibility } from "@/generated/prisma/client";
import type { QuestFormState } from "@/modules/preparation/quests/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QUEST_STATUS_OPTIONS } from "@/components/wiki/status-config";
import { VisibilityField } from "@/components/wiki/visibility-field";
import { TagPicker, type TagOption } from "@/components/wiki/tag-picker";

export interface QuestFormDefaultValues {
  title?: string;
  description?: string | null;
  objective?: string | null;
  reward?: string | null;
  status?: QuestStatus;
  visibility?: Visibility;
}

interface QuestFormProps {
  campaignId: string;
  action: (state: QuestFormState, formData: FormData) => Promise<QuestFormState>;
  submitLabel: string;
  defaultValues?: QuestFormDefaultValues;
  availableTags: TagOption[];
  defaultSelectedTagIds?: string[];
}

export function QuestForm({
  campaignId,
  action,
  submitLabel,
  defaultValues,
  availableTags,
  defaultSelectedTagIds,
}: QuestFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.message && (
        <p className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm">{state.message}</p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" required defaultValue={defaultValues?.title} placeholder="Título da missão" />
        {state?.errors?.title && <p className="text-xs text-destructive">{state.errors.title[0]}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="objective">Objetivo</Label>
        <Textarea id="objective" name="objective" rows={2} defaultValue={defaultValues?.objective ?? ""} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={defaultValues?.description ?? ""} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reward">Recompensa</Label>
        <Textarea id="reward" name="reward" rows={2} defaultValue={defaultValues?.reward ?? ""} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={defaultValues?.status ?? "NOT_STARTED"}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUEST_STATUS_OPTIONS.map(([value, label]) => (
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
