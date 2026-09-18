"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import type { ResourceDef } from "@/generated/prisma/client";
import { createResourceAction, deleteResourceAction, updateResourceAction } from "@/modules/gametools/system/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useInlineEditAction } from "@/components/system/use-inline-edit-action";

function ResourceRow({ resource, campaignId, canManage }: { resource: ResourceDef; campaignId: string; canManage: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { handleSubmit, result, isPending } = useInlineEditAction(
    (formData) => updateResourceAction(campaignId, resource.id, undefined, formData),
    () => setIsEditing(false),
  );

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border border-border p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`name-${resource.id}`}>Nome</Label>
            <Input id={`name-${resource.id}`} name="name" defaultValue={resource.name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`defaultMax-${resource.id}`}>Máximo padrão</Label>
            <Input
              id={`defaultMax-${resource.id}`}
              name="defaultMax"
              type="number"
              min={0}
              className="w-28"
              defaultValue={resource.defaultMax}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`description-${resource.id}`}>Descrição</Label>
          <Textarea id={`description-${resource.id}`} name="description" rows={2} defaultValue={resource.description ?? ""} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="gmOnly" defaultChecked={resource.gmOnly} className="size-4 accent-primary" />
            Campo secreto (só o mestre vê)
          </label>
          <div className="flex gap-1">
            <Button type="submit" size="icon" variant="ghost" disabled={isPending}>
              <Check className="size-4" />
            </Button>
            <Button type="button" size="icon" variant="ghost" disabled={isPending} onClick={() => setIsEditing(false)}>
              <X className="size-4" />
            </Button>
          </div>
        </div>
        {result?.errors && <p className="text-xs text-destructive">{Object.values(result.errors).flat()[0]}</p>}
        {result?.error && <p className="text-xs text-destructive">{result.error}</p>}
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{resource.name}</span>
          <Badge variant="outline" className="font-mono">
            {"{" + resource.key + "}"}
          </Badge>
          {resource.gmOnly && <Badge variant="warning">Secreto</Badge>}
          <span className="text-xs text-muted-foreground">Máximo padrão: {resource.defaultMax}</span>
        </div>
        {resource.description && <p className="mt-1 text-xs text-muted-foreground">{resource.description}</p>}
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
        title={`Excluir o recurso "${resource.name}"?`}
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={() => deleteResourceAction(campaignId, resource.id)}
      />
    </div>
  );
}

function AddResourceForm({ campaignId }: { campaignId: string }) {
  const action = createResourceAction.bind(null, campaignId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state?.message) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
      <p className="text-sm font-medium">Novo recurso</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-resource-name">Nome</Label>
          <Input id="new-resource-name" name="name" placeholder="Pontos de Vida" autoComplete="off" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-resource-max">Máximo padrão</Label>
          <Input id="new-resource-max" name="defaultMax" type="number" min={0} className="w-28" defaultValue={0} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-resource-description">Descrição (opcional)</Label>
        <Textarea id="new-resource-description" name="description" rows={2} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="gmOnly" className="size-4 accent-primary" />
          Campo secreto (só o mestre vê)
        </label>
        <Button type="submit" variant="outline" disabled={pending}>
          <Plus className="size-4" /> {pending ? "Salvando…" : "Adicionar"}
        </Button>
      </div>
      {state?.errors && <p className="text-xs text-destructive">{Object.values(state.errors).flat()[0]}</p>}
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}

export function ResourceList({
  campaignId,
  resources,
  canManage,
}: {
  campaignId: string;
  resources: ResourceDef[];
  canManage: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {resources.length === 0 && <p className="text-sm text-muted-foreground">Nenhum recurso criado ainda.</p>}
      {resources.map((resource) => (
        <ResourceRow key={resource.id} resource={resource} campaignId={campaignId} canManage={canManage} />
      ))}
      {canManage && <AddResourceForm campaignId={campaignId} />}
    </div>
  );
}
