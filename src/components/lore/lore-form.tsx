"use client";

import { useActionState } from "react";

import type { CanonStatus, Visibility } from "@/generated/prisma/client";
import type { LorePageFormState } from "@/modules/creation/lore/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/campaigns/image-upload-field";
import { CanonStatusField } from "@/components/wiki/canon-status-field";
import { VisibilityField } from "@/components/wiki/visibility-field";
import { TagPicker, type TagOption } from "@/components/wiki/tag-picker";
import { LoreContentEditor } from "@/components/lore/lore-content-editor";

export interface LorePageFormDefaultValues {
  title?: string;
  content?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  canonStatus?: CanonStatus;
  visibility?: Visibility;
}

interface LoreFormProps {
  campaignId: string;
  action: (state: LorePageFormState, formData: FormData) => Promise<LorePageFormState>;
  submitLabel: string;
  defaultValues?: LorePageFormDefaultValues;
  availableTags: TagOption[];
  defaultSelectedTagIds?: string[];
}

export function LoreForm({
  campaignId,
  action,
  submitLabel,
  defaultValues,
  availableTags,
  defaultSelectedTagIds,
}: LoreFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.message && (
        <p className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm">{state.message}</p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" required defaultValue={defaultValues?.title} placeholder="Título da página" />
        {state?.errors?.title && <p className="text-xs text-destructive">{state.errors.title[0]}</p>}
      </div>

      <ImageUploadField
        name="imageUrl"
        label="Imagem"
        campaignId={campaignId}
        defaultValue={defaultValues?.imageUrl}
        shape="banner"
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="category">Categoria</Label>
        <Input
          id="category"
          name="category"
          defaultValue={defaultValues?.category ?? ""}
          placeholder="Ex: História, Religião, Geografia…"
        />
      </div>

      <LoreContentEditor defaultValue={defaultValues?.content} />

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
