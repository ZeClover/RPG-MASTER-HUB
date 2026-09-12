"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

import { quickCreateIdeaAction } from "@/modules/creation/ideas/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function QuickAddIdeaForm({ campaignId }: { campaignId: string }) {
  const action = quickCreateIdeaAction.bind(null, campaignId);
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
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          name="title"
          placeholder="Nova ideia… (dragão embaixo da escola, professor desaparecido…)"
          className="flex-1"
          autoComplete="off"
        />
        <Button type="submit" disabled={pending}>
          <Plus className="size-4" /> {pending ? "Salvando…" : "Adicionar"}
        </Button>
      </div>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
