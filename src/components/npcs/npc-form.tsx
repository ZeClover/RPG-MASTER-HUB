"use client";

import { useActionState } from "react";

import type { CanonStatus, Visibility } from "@/generated/prisma/client";
import type { NpcFormState } from "@/modules/creation/npcs/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/campaigns/image-upload-field";
import { CanonStatusField } from "@/components/wiki/canon-status-field";
import { VisibilityField } from "@/components/wiki/visibility-field";
import { TagPicker, type TagOption } from "@/components/wiki/tag-picker";

export interface NpcFormDefaultValues {
  name?: string;
  imageUrl?: string | null;
  age?: string | null;
  species?: string | null;
  gender?: string | null;
  appearance?: string | null;
  personality?: string | null;
  history?: string | null;
  goals?: string | null;
  fears?: string | null;
  secrets?: string | null;
  narrativeStatus?: string | null;
  gmNotes?: string | null;
  canonStatus?: CanonStatus;
  visibility?: Visibility;
}

interface NpcFormProps {
  campaignId: string;
  action: (state: NpcFormState, formData: FormData) => Promise<NpcFormState>;
  submitLabel: string;
  defaultValues?: NpcFormDefaultValues;
  availableTags: TagOption[];
  defaultSelectedTagIds?: string[];
}

export function NpcForm({
  campaignId,
  action,
  submitLabel,
  defaultValues,
  availableTags,
  defaultSelectedTagIds,
}: NpcFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.message && (
        <p className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm">{state.message}</p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required defaultValue={defaultValues?.name} placeholder="Nome do NPC" />
        {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
      </div>

      <ImageUploadField
        name="imageUrl"
        label="Imagem"
        campaignId={campaignId}
        defaultValue={defaultValues?.imageUrl}
        shape="square"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="age">Idade</Label>
          <Input id="age" name="age" defaultValue={defaultValues?.age ?? ""} placeholder="Opcional" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="species">Raça/Espécie</Label>
          <Input id="species" name="species" defaultValue={defaultValues?.species ?? ""} placeholder="Opcional" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="gender">Gênero</Label>
          <Input id="gender" name="gender" defaultValue={defaultValues?.gender ?? ""} placeholder="Opcional" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="narrativeStatus">Status narrativo</Label>
        <Input
          id="narrativeStatus"
          name="narrativeStatus"
          defaultValue={defaultValues?.narrativeStatus ?? ""}
          placeholder="Ex: Vivo, Desaparecido, Preso…"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="appearance">Aparência</Label>
        <Textarea id="appearance" name="appearance" rows={3} defaultValue={defaultValues?.appearance ?? ""} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="personality">Personalidade</Label>
        <Textarea id="personality" name="personality" rows={3} defaultValue={defaultValues?.personality ?? ""} />
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
          <Label htmlFor="fears">Medos</Label>
          <Textarea id="fears" name="fears" rows={3} defaultValue={defaultValues?.fears ?? ""} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="secrets">Segredos</Label>
        <Textarea id="secrets" name="secrets" rows={3} defaultValue={defaultValues?.secrets ?? ""} />
        <p className="text-xs text-muted-foreground">Sempre tratado como informação do Mestre.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="gmNotes">Notas do Mestre</Label>
        <Textarea id="gmNotes" name="gmNotes" rows={3} defaultValue={defaultValues?.gmNotes ?? ""} />
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
