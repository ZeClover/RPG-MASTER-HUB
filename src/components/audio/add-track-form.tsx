"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { createAudioTrackAction } from "@/modules/audio/actions";
import { AudioUploadField } from "@/components/audio/audio-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AddTrackForm({ campaignId }: { campaignId: string }) {
  const action = createAudioTrackAction.bind(null, campaignId);
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
        <CardTitle>Adicionar faixa</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          {state?.message && <p className="text-sm text-destructive">{state.message}</p>}

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required placeholder="Ex.: Batalha épica, Porta rangendo…" />
            {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Categoria</Label>
            <Select key={resetKey} name="category" defaultValue="MUSIC">
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MUSIC">Música</SelectItem>
                <SelectItem value="SFX">Efeito sonoro</SelectItem>
              </SelectContent>
            </Select>
            {state?.errors?.category && <p className="text-xs text-destructive">{state.errors.category[0]}</p>}
          </div>

          <AudioUploadField key={resetKey} name="fileUrl" label="Arquivo de áudio" campaignId={campaignId} />
          {state?.errors?.fileUrl && <p className="text-xs text-destructive">{state.errors.fileUrl[0]}</p>}

          <div className="flex items-center gap-2">
            <input id="loop" type="checkbox" name="loop" defaultChecked className="size-4 shrink-0 accent-primary" />
            <Label htmlFor="loop">Repetir em loop</Label>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              <Plus className="size-4" /> {pending ? "Adicionando…" : "Adicionar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
