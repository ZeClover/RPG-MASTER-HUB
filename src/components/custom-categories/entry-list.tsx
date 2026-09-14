"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Plus, X } from "lucide-react";

import type { CustomCategoryEntry } from "@/generated/prisma/client";
import { createEntryAction, deleteEntryAction } from "@/modules/gametools/custom-categories/entry-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/campaigns/image-upload-field";
import { VisibilityField } from "@/components/wiki/visibility-field";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";
import { Card } from "@/components/ui/card";

function EntryCard({
  entry,
  campaignId,
  categoryId,
  canManage,
}: {
  entry: CustomCategoryEntry;
  campaignId: string;
  categoryId: string;
  canManage: boolean;
}) {
  const [isDeleting, startDeleteTransition] = useTransition();

  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-sm font-medium">{entry.title}</span>
          <VisibilityBadge visibility={entry.visibility} />
        </div>
        {canManage && (
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => startDeleteTransition(() => deleteEntryAction(campaignId, categoryId, entry.id))}
            className="shrink-0 rounded p-1 text-muted-foreground opacity-60 transition-opacity hover:bg-surface-elevated hover:opacity-100"
            aria-label={`Remover entrada ${entry.title}`}
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {entry.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- upload local ou Vercel Blob, sem domínio fixo para next/image
        <img src={entry.imageUrl} alt={entry.title} className="max-h-48 w-full rounded-md object-contain" />
      )}
      {entry.content && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{entry.content}</p>}
    </Card>
  );
}

function AddEntryForm({ campaignId, categoryId }: { campaignId: string; categoryId: string }) {
  const action = createEntryAction.bind(null, campaignId, categoryId);
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
    <Card className="p-4">
      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <p className="text-sm font-medium">Nova entrada</p>

        {state?.error && <p className="text-xs text-destructive">{state.error}</p>}

        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" name="title" required placeholder="Ex.: Poções, Feitiçaria, Regra especial…" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="content">Conteúdo (opcional)</Label>
          <Textarea id="content" name="content" rows={3} />
        </div>

        <ImageUploadField name="imageUrl" label="Imagem (opcional)" campaignId={campaignId} />

        <VisibilityField />

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            <Plus className="size-4" /> {pending ? "Adicionando…" : "Adicionar entrada"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function EntryList({
  campaignId,
  categoryId,
  entries,
  canManage,
}: {
  campaignId: string;
  categoryId: string;
  entries: CustomCategoryEntry[];
  canManage: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {canManage ? "Nenhuma entrada ainda." : "Nenhuma entrada visível para você ainda."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} campaignId={campaignId} categoryId={categoryId} canManage={canManage} />
          ))}
        </div>
      )}

      {canManage && <AddEntryForm campaignId={campaignId} categoryId={categoryId} />}
    </div>
  );
}
