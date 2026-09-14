"use client";

import { useActionState } from "react";

import type { CharacterFormState } from "@/modules/players/characters/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/campaigns/image-upload-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface CharacterFormDefaultValues {
  name?: string;
  concept?: string | null;
  imageUrl?: string | null;
  bio?: string | null;
  gmNotes?: string | null;
}

export interface AssignableMember {
  id: string;
  label: string;
}

interface CharacterFormProps {
  campaignId: string;
  action: (state: CharacterFormState, formData: FormData) => Promise<CharacterFormState>;
  submitLabel: string;
  defaultValues?: CharacterFormDefaultValues;
  /** CO_GM/OWNER veem e podem editar Notas do Mestre. */
  canEditGmNotes: boolean;
  /** Só na criação, e só para CO_GM/OWNER: atribuir a ficha a um jogador específico em vez do autor. */
  assignableMembers?: AssignableMember[];
}

export function CharacterForm({
  campaignId,
  action,
  submitLabel,
  defaultValues,
  canEditGmNotes,
  assignableMembers,
}: CharacterFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.message && (
        <p className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm">{state.message}</p>
      )}
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      {assignableMembers && assignableMembers.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="playerId">Atribuir a</Label>
          <Select name="playerId" defaultValue="__self__">
            <SelectTrigger id="playerId">
              <SelectValue placeholder="Você mesmo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__self__">Você mesmo</SelectItem>
              {assignableMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Use para criar a ficha de um jogador que ainda não acessou o hub.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required defaultValue={defaultValues?.name} placeholder="Nome do personagem" />
        {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="concept">Conceito</Label>
        <Input
          id="concept"
          name="concept"
          defaultValue={defaultValues?.concept ?? ""}
          placeholder="Ex.: Ladina exilada, Guerreiro devoto…"
        />
        {state?.errors?.concept && <p className="text-xs text-destructive">{state.errors.concept[0]}</p>}
      </div>

      <ImageUploadField
        name="imageUrl"
        label="Imagem (opcional)"
        campaignId={campaignId}
        defaultValue={defaultValues?.imageUrl}
        shape="square"
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="bio">Biografia</Label>
        <Textarea id="bio" name="bio" rows={5} defaultValue={defaultValues?.bio ?? ""} placeholder="Opcional" />
        {state?.errors?.bio && <p className="text-xs text-destructive">{state.errors.bio[0]}</p>}
      </div>

      {canEditGmNotes && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="gmNotes">Notas do Mestre</Label>
          <Textarea id="gmNotes" name="gmNotes" rows={3} defaultValue={defaultValues?.gmNotes ?? ""} />
          <p className="text-xs text-muted-foreground">Visível só para Co-Mestres e a Mestre da campanha.</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
