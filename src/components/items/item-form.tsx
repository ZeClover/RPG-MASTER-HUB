"use client";

import { useActionState } from "react";

import type { CanonStatus, Visibility } from "@/generated/prisma/client";
import type { ItemFormState } from "@/modules/gametools/items/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/campaigns/image-upload-field";
import { CanonStatusField } from "@/components/wiki/canon-status-field";
import { VisibilityField } from "@/components/wiki/visibility-field";
import { TagPicker, type TagOption } from "@/components/wiki/tag-picker";

const ITEM_CATEGORY_SUGGESTIONS = [
  "Arma",
  "Armadura",
  "Consumível",
  "Anel",
  "Amuleto",
  "Comum",
  "Raro",
  "Lendário",
  "Amaldiçoado",
];

export interface ItemFormDefaultValues {
  name?: string;
  imageUrl?: string | null;
  category?: string | null;
  description?: string | null;
  effect?: string | null;
  canonStatus?: CanonStatus;
  visibility?: Visibility;
}

interface ItemFormProps {
  campaignId: string;
  action: (state: ItemFormState, formData: FormData) => Promise<ItemFormState>;
  submitLabel: string;
  defaultValues?: ItemFormDefaultValues;
  availableTags: TagOption[];
  defaultSelectedTagIds?: string[];
}

export function ItemForm({
  campaignId,
  action,
  submitLabel,
  defaultValues,
  availableTags,
  defaultSelectedTagIds,
}: ItemFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.message && (
        <p className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm">{state.message}</p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required defaultValue={defaultValues?.name} placeholder="Nome do item" />
        {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
      </div>

      <ImageUploadField
        name="imageUrl"
        label="Ícone / imagem"
        campaignId={campaignId}
        defaultValue={defaultValues?.imageUrl}
        shape="square"
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="category">Tipo / raridade</Label>
        <Input
          id="category"
          name="category"
          list="item-category-suggestions"
          defaultValue={defaultValues?.category ?? ""}
          placeholder="Ex.: Arma rara, Anel +1…"
        />
        <datalist id="item-category-suggestions">
          {ITEM_CATEGORY_SUGGESTIONS.map((suggestion) => (
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
          placeholder="Aparência, origem, lore…"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="effect">Efeito</Label>
        <Textarea
          id="effect"
          name="effect"
          rows={3}
          defaultValue={defaultValues?.effect ?? ""}
          placeholder="O que o item faz mecanicamente…"
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
