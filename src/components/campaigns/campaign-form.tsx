"use client";

import { useActionState } from "react";

import type { CampaignFormState } from "@/modules/core/campaigns/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/campaigns/image-upload-field";
import { ColorField } from "@/components/campaigns/color-field";
import { toDateTimeLocalValue } from "@/lib/format";

export interface CampaignFormDefaultValues {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  bannerUrl?: string | null;
  iconUrl?: string | null;
  symbolUrl?: string | null;
  backgroundUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  nextSessionAt?: Date | string | null;
}

interface CampaignFormProps {
  action: (state: CampaignFormState, formData: FormData) => Promise<CampaignFormState>;
  campaignId?: string;
  submitLabel: string;
  defaultValues?: CampaignFormDefaultValues;
}

export function CampaignForm({ action, campaignId, submitLabel, defaultValues }: CampaignFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.message && (
        <p className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome da campanha</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          placeholder="Ex: Guerra Kamau/Degenhardt"
        />
        {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
          placeholder="Sobre o que é essa campanha?"
          rows={4}
        />
        {state?.errors?.description && <p className="text-xs text-destructive">{state.errors.description[0]}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUploadField
          name="iconUrl"
          label="Ícone"
          campaignId={campaignId}
          defaultValue={defaultValues?.iconUrl}
          shape="square"
        />
        <ImageUploadField
          name="symbolUrl"
          label="Símbolo"
          campaignId={campaignId}
          defaultValue={defaultValues?.symbolUrl}
          shape="square"
        />
        <ImageUploadField
          name="imageUrl"
          label="Imagem de capa"
          campaignId={campaignId}
          defaultValue={defaultValues?.imageUrl}
          shape="banner"
        />
        <ImageUploadField
          name="bannerUrl"
          label="Banner"
          campaignId={campaignId}
          defaultValue={defaultValues?.bannerUrl}
          shape="banner"
        />
      </div>

      <ImageUploadField
        name="backgroundUrl"
        label="Background (opcional)"
        campaignId={campaignId}
        defaultValue={defaultValues?.backgroundUrl}
        shape="banner"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField name="primaryColor" label="Cor principal" defaultValue={defaultValues?.primaryColor} />
        <ColorField
          name="secondaryColor"
          label="Cor secundária"
          defaultValue={defaultValues?.secondaryColor}
          fallback="#f2a93c"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="nextSessionAt">Próxima sessão</Label>
        <Input
          id="nextSessionAt"
          name="nextSessionAt"
          type="datetime-local"
          defaultValue={toDateTimeLocalValue(defaultValues?.nextSessionAt ?? null)}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
