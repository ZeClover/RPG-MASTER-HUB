"use client";

import { useActionState } from "react";

import type { CanonStatus, Visibility } from "@/generated/prisma/client";
import type { FactionFormState } from "@/modules/creation/factions/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/campaigns/image-upload-field";
import { CanonStatusField } from "@/components/wiki/canon-status-field";
import { VisibilityField } from "@/components/wiki/visibility-field";
import { TagPicker, type TagOption } from "@/components/wiki/tag-picker";

const FACTION_TYPE_SUGGESTIONS = [
  "Família",
  "Guilda",
  "Reino",
  "Governo",
  "Culto",
  "Gangue",
  "Empresa",
  "Exército",
  "Organização",
  "Sociedade secreta",
];

export interface FactionFormDefaultValues {
  name?: string;
  imageUrl?: string | null;
  factionType?: string | null;
  description?: string | null;
  history?: string | null;
  goals?: string | null;
  resources?: string | null;
  secrets?: string | null;
  notes?: string | null;
  canonStatus?: CanonStatus;
  visibility?: Visibility;
}

interface FactionFormProps {
  campaignId: string;
  action: (state: FactionFormState, formData: FormData) => Promise<FactionFormState>;
  submitLabel: string;
  defaultValues?: FactionFormDefaultValues;
  availableTags: TagOption[];
  defaultSelectedTagIds?: string[];
}

export function FactionForm({
  campaignId,
  action,
  submitLabel,
  defaultValues,
  availableTags,
  defaultSelectedTagIds,
}: FactionFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.message && (
        <p className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm">{state.message}</p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required defaultValue={defaultValues?.name} placeholder="Nome da facção" />
        {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
      </div>

      <ImageUploadField
        name="imageUrl"
        label="Símbolo / imagem"
        campaignId={campaignId}
        defaultValue={defaultValues?.imageUrl}
        shape="square"
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="factionType">Tipo</Label>
        <Input
          id="factionType"
          name="factionType"
          list="faction-type-suggestions"
          defaultValue={defaultValues?.factionType ?? ""}
          placeholder="Ex: Guilda, Culto, Governo…"
        />
        <datalist id="faction-type-suggestions">
          {FACTION_TYPE_SUGGESTIONS.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={defaultValues?.description ?? ""} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="history">História</Label>
        <Textarea id="history" name="history" rows={4} defaultValue={defaultValues?.history ?? ""} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="goals">Objetivos</Label>
          <Textarea id="goals" name="goals" rows={3} defaultValue={defaultValues?.goals ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="resources">Recursos</Label>
          <Textarea id="resources" name="resources" rows={3} defaultValue={defaultValues?.resources ?? ""} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="secrets">Segredos</Label>
        <Textarea id="secrets" name="secrets" rows={3} defaultValue={defaultValues?.secrets ?? ""} />
        <p className="text-xs text-muted-foreground">Sempre tratado como informação do Mestre.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={defaultValues?.notes ?? ""} />
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
