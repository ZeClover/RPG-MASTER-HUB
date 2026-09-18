"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import type { ConditionDef } from "@/generated/prisma/client";
import { createConditionAction, deleteConditionAction, updateConditionAction } from "@/modules/gametools/system/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useInlineEditAction } from "@/components/system/use-inline-edit-action";

function ConditionRow({ condition, campaignId, canManage }: { condition: ConditionDef; campaignId: string; canManage: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [color, setColor] = useState(condition.color ?? "");

  const { handleSubmit, result, isPending } = useInlineEditAction(
    (formData) => updateConditionAction(campaignId, condition.id, undefined, formData),
    () => setIsEditing(false),
  );

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border border-border p-3">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : "#f97316"}
            onChange={(event) => setColor(event.target.value)}
            className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0"
          />
          <input type="hidden" name="color" value={color} />
          <Input name="name" defaultValue={condition.name} required className="flex-1" />
        </div>
        <Textarea name="description" rows={2} defaultValue={condition.description ?? ""} placeholder="Descrição (opcional)" />
        <div className="flex justify-end gap-1">
          <Button type="submit" size="icon" variant="ghost" disabled={isPending}>
            <Check className="size-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" disabled={isPending} onClick={() => setIsEditing(false)}>
            <X className="size-4" />
          </Button>
        </div>
        {result?.errors && <p className="text-xs text-destructive">{Object.values(result.errors).flat()[0]}</p>}
        {result?.error && <p className="text-xs text-destructive">{result.error}</p>}
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0 flex-1">
        <Badge
          variant="secondary"
          style={condition.color ? { borderColor: condition.color, color: condition.color } : undefined}
          className="border"
        >
          {condition.name}
        </Badge>
        {condition.description && <p className="mt-1 text-xs text-muted-foreground">{condition.description}</p>}
      </div>
      {canManage && (
        <div className="flex shrink-0 items-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
            <Pencil className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Excluir a condição "${condition.name}"?`}
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={() => deleteConditionAction(campaignId, condition.id)}
      />
    </div>
  );
}

function AddConditionForm({ campaignId }: { campaignId: string }) {
  const action = createConditionAction.bind(null, campaignId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [color, setColor] = useState("#f97316");
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state?.message) {
      formRef.current?.reset();
      setColor("#f97316");
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
      <p className="text-sm font-medium">Nova condição</p>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0"
        />
        <input type="hidden" name="color" value={color} />
        <Input name="name" placeholder="Envenenado" autoComplete="off" className="flex-1" />
      </div>
      <Textarea name="description" rows={2} placeholder="Descrição (opcional)" />
      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={pending}>
          <Plus className="size-4" /> {pending ? "Salvando…" : "Adicionar"}
        </Button>
      </div>
      {state?.errors && <p className="text-xs text-destructive">{Object.values(state.errors).flat()[0]}</p>}
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}

export function ConditionList({
  campaignId,
  conditions,
  canManage,
}: {
  campaignId: string;
  conditions: ConditionDef[];
  canManage: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {conditions.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma condição criada ainda.</p>}
      {conditions.map((condition) => (
        <ConditionRow key={condition.id} condition={condition} campaignId={campaignId} canManage={canManage} />
      ))}
      {canManage && <AddConditionForm campaignId={campaignId} />}
    </div>
  );
}
