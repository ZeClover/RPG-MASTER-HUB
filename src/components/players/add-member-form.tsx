"use client";

import { useActionState, useEffect, useRef } from "react";
import { UserPlus } from "lucide-react";

import { addCampaignMemberAction } from "@/modules/players/members/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AddMemberForm({ campaignId }: { campaignId: string }) {
  const action = addCampaignMemberAction.bind(null, campaignId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="email">E-mail da pessoa</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="jogador@exemplo.com"
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-2 sm:w-44">
          <Label htmlFor="role">Papel</Label>
          <Select name="role" defaultValue="PLAYER">
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PLAYER">Jogador</SelectItem>
              <SelectItem value="CO_GM">Co-Mestre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={pending}>
          <UserPlus className="size-4" /> {pending ? "Adicionando…" : "Adicionar"}
        </Button>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.message && <p className="text-sm text-success">{state.message}</p>}
      <p className="text-xs text-muted-foreground">
        A pessoa precisa já ter uma conta no hub — este formulário não envia convite por e-mail, adiciona direto
        quem já está cadastrado (ver ARCHITECTURE.md).
      </p>
    </form>
  );
}
