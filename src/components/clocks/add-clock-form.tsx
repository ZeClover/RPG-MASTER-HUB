"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { createClockAction } from "@/modules/worldbuilding/clocks/actions";
import { CLOCK_SEGMENT_OPTIONS } from "@/modules/worldbuilding/clocks/schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AddClockForm({ campaignId }: { campaignId: string }) {
  const action = createClockAction.bind(null, campaignId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.errors) {
      formRef.current?.reset();
      setResetKey((key) => key + 1);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo relógio</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          {state?.message && <p className="text-sm text-destructive">{state.message}</p>}

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" required placeholder="Ex.: O culto completa o ritual" />
            {state?.errors?.title && <p className="text-xs text-destructive">{state.errors.title[0]}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" rows={2} placeholder="O que acontece quando encher?" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="segments">Segmentos</Label>
            <Select key={resetKey} name="segments" defaultValue="4">
              <SelectTrigger id="segments">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLOCK_SEGMENT_OPTIONS.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value} segmentos
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.errors?.segments && <p className="text-xs text-destructive">{state.errors.segments[0]}</p>}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              <Plus className="size-4" /> {pending ? "Criando…" : "Criar relógio"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
