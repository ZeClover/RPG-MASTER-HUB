"use client";

import { useActionState } from "react";

import type { CanonStatus, Visibility } from "@/generated/prisma/client";
import type { MonsterFormState } from "@/modules/gametools/monsters/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/campaigns/image-upload-field";
import { CanonStatusField } from "@/components/wiki/canon-status-field";
import { VisibilityField } from "@/components/wiki/visibility-field";
import { TagPicker, type TagOption } from "@/components/wiki/tag-picker";

export interface MonsterFormDefaultValues {
  name?: string;
  imageUrl?: string | null;
  isBoss?: boolean;
  description?: string | null;
  canonStatus?: CanonStatus;
  visibility?: Visibility;
}

interface MonsterFormProps {
  campaignId: string;
  action: (state: MonsterFormState, formData: FormData) => Promise<MonsterFormState>;
  submitLabel: string;
  defaultValues?: MonsterFormDefaultValues;
  availableTags: TagOption[];
  defaultSelectedTagIds?: string[];
}

export function MonsterForm({
  campaignId,
  action,
  submitLabel,
  defaultValues,
  availableTags,
  defaultSelectedTagIds,
}: MonsterFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.message && (
        <p className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm">{state.message}</p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required defaultValue={defaultValues?.name} placeholder="Nome do monstro" />
        {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
      </div>

      <ImageUploadField
        name="imageUrl"
        label="Retrato / imagem"
        campaignId={campaignId}
        defaultValue={defaultValues?.imageUrl}
        shape="square"
      />

      <div className="flex items-center gap-2">
        <input
          id="isBoss"
          type="checkbox"
          name="isBoss"
          defaultChecked={defaultValues?.isBoss}
          className="size-4 shrink-0 accent-primary"
        />
        <Label htmlFor="isBoss">É um chefe (Boss)</Label>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaultValues?.description ?? ""}
          placeholder="Aparência, comportamento, história…"
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
