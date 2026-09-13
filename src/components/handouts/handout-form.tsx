"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { createHandoutAction } from "@/modules/players/handouts/actions";
import { ImageUploadField } from "@/components/campaigns/image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HandoutForm({ campaignId }: { campaignId: string }) {
  const action = createHandoutAction.bind(null, campaignId);
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
        <CardTitle>Novo handout</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          {state?.message && <p className="text-sm text-destructive">{state.message}</p>}

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" required placeholder="Ex.: Carta encontrada, Mapa da masmorra…" />
            {state?.errors?.title && <p className="text-xs text-destructive">{state.errors.title[0]}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="content">Conteúdo (opcional)</Label>
            <Textarea id="content" name="content" rows={4} placeholder="Texto que os jogadores vão ler" />
            {state?.errors?.content && <p className="text-xs text-destructive">{state.errors.content[0]}</p>}
          </div>

          <ImageUploadField key={resetKey} name="imageUrl" label="Imagem (opcional)" campaignId={campaignId} />

          <p className="text-xs text-muted-foreground">
            O handout começa oculto — os jogadores só o veem depois que você clicar em &quot;Revelar&quot; na lista
            abaixo.
          </p>

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
