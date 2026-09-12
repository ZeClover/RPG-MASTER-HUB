"use client";

import { useActionState } from "react";

import { saveDiscordLinkAction } from "@/modules/audio/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface DiscordLinkFormProps {
  campaignId: string;
  discordLink?: { guildId: string; voiceChannelId: string } | null;
}

export function DiscordLinkForm({ campaignId, discordLink }: DiscordLinkFormProps) {
  const action = saveDiscordLinkAction.bind(null, campaignId);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Ative o Modo desenvolvedor no Discord (Configurações do usuário → Avançado → Modo desenvolvedor), depois
        clique com o botão direito no ícone do servidor e em &quot;Copiar ID do servidor&quot;, e no canal de voz e em
        &quot;Copiar ID do canal&quot;.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        {state?.message && <p className="text-sm text-destructive">{state.message}</p>}

        <div className="flex flex-col gap-2">
          <Label htmlFor="guildId">ID do servidor</Label>
          <Input id="guildId" name="guildId" required defaultValue={discordLink?.guildId} />
          {state?.errors?.guildId && <p className="text-xs text-destructive">{state.errors.guildId[0]}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="voiceChannelId">ID do canal de voz</Label>
          <Input id="voiceChannelId" name="voiceChannelId" required defaultValue={discordLink?.voiceChannelId} />
          {state?.errors?.voiceChannelId && (
            <p className="text-xs text-destructive">{state.errors.voiceChannelId[0]}</p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
