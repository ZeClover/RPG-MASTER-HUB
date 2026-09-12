"use client";

import { useActionState } from "react";

import type { CanonStatus, Visibility } from "@/generated/prisma/client";
import type { LocationFormState } from "@/modules/creation/locations/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/campaigns/image-upload-field";
import { CanonStatusField } from "@/components/wiki/canon-status-field";
import { VisibilityField } from "@/components/wiki/visibility-field";
import { TagPicker, type TagOption } from "@/components/wiki/tag-picker";
import { LocationParentPicker } from "@/components/locations/location-parent-picker";

const LOCATION_TYPE_SUGGESTIONS = [
  "Mundo",
  "Continente",
  "Reino",
  "Região",
  "Cidade",
  "Vila",
  "Bairro",
  "Construção",
  "Sala",
  "Masmorra",
];

export interface LocationFormDefaultValues {
  name?: string;
  imageUrl?: string | null;
  description?: string | null;
  locationType?: string | null;
  notes?: string | null;
  canonStatus?: CanonStatus;
  visibility?: Visibility;
  parent?: { id: string; name: string } | null;
}

interface LocationFormProps {
  campaignId: string;
  currentLocationId?: string;
  action: (state: LocationFormState, formData: FormData) => Promise<LocationFormState>;
  submitLabel: string;
  defaultValues?: LocationFormDefaultValues;
  availableTags: TagOption[];
  defaultSelectedTagIds?: string[];
}

export function LocationForm({
  campaignId,
  currentLocationId,
  action,
  submitLabel,
  defaultValues,
  availableTags,
  defaultSelectedTagIds,
}: LocationFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required defaultValue={defaultValues?.name} placeholder="Nome do local" />
        {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
      </div>

      <ImageUploadField
        name="imageUrl"
        label="Imagem"
        campaignId={campaignId}
        defaultValue={defaultValues?.imageUrl}
        shape="banner"
      />

      <LocationParentPicker
        campaignId={campaignId}
        currentLocationId={currentLocationId}
        defaultParent={defaultValues?.parent}
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="locationType">Tipo</Label>
        <Input
          id="locationType"
          name="locationType"
          list="location-type-suggestions"
          defaultValue={defaultValues?.locationType ?? ""}
          placeholder="Ex: Cidade, Região, Construção…"
        />
        <datalist id="location-type-suggestions">
          {LOCATION_TYPE_SUGGESTIONS.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={defaultValues?.description ?? ""} />
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
