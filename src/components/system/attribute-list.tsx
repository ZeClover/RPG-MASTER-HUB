"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import type { AttributeDef } from "@/generated/prisma/client";
import {
  createAttributeAction,
  deleteAttributeAction,
  updateAttributeAction,
} from "@/modules/gametools/system/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useInlineEditAction } from "@/components/system/use-inline-edit-action";

function AffectedFormulasNotice({ names }: { names: string[] }) {
  if (names.length === 0) return "Excluir este atributo não pode ser desfeito.";
  return (
    <>
      Excluir este atributo não pode ser desfeito. Ele é referenciado por{" "}
      {names.length === 1 ? "esta fórmula" : "estas fórmulas"}: <strong>{names.join(", ")}</strong> — depois de
      excluir, o token correspondente vira &ldquo;0&rdquo; nelas (fórmula não quebra, mas o cálculo muda).
    </>
  );
}

function AttributeRow({
  attribute,
  campaignId,
  referencingFormulas,
  canManage,
}: {
  attribute: AttributeDef;
  campaignId: string;
  referencingFormulas: string[];
  canManage: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { handleSubmit, result, isPending } = useInlineEditAction(
    (formData) => updateAttributeAction(campaignId, attribute.id, undefined, formData),
    () => setIsEditing(false),
  );

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border border-border p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`name-${attribute.id}`}>Nome</Label>
            <Input id={`name-${attribute.id}`} name="name" defaultValue={attribute.name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`defaultValue-${attribute.id}`}>Valor padrão</Label>
            <Input
              id={`defaultValue-${attribute.id}`}
              name="defaultValue"
              type="number"
              className="w-28"
              defaultValue={attribute.defaultValue}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`description-${attribute.id}`}>Descrição</Label>
          <Textarea
            id={`description-${attribute.id}`}
            name="description"
            rows={2}
            defaultValue={attribute.description ?? ""}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="gmOnly" defaultChecked={attribute.gmOnly} className="size-4 accent-primary" />
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
        {result?.errors && (
          <p className="text-xs text-destructive">{Object.values(result.errors).flat()[0]}</p>
        )}
        {result?.error && <p className="text-xs text-destructive">{result.error}</p>}
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{attribute.name}</span>
          <Badge variant="outline" className="font-mono">
            {"{" + attribute.key + "}"}
          </Badge>
          {attribute.gmOnly && <Badge variant="warning">Secreto</Badge>}
          <span className="text-xs text-muted-foreground">Padrão: {attribute.defaultValue}</span>
        </div>
        {attribute.description && <p className="mt-1 text-xs text-muted-foreground">{attribute.description}</p>}
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
        title={`Excluir o atributo "${attribute.name}"?`}
        description={<AffectedFormulasNotice names={referencingFormulas} />}
        confirmLabel="Excluir"
        onConfirm={() => deleteAttributeAction(campaignId, attribute.id)}
      />
    </div>
  );
}

function AddAttributeForm({ campaignId }: { campaignId: string }) {
  const action = createAttributeAction.bind(null, campaignId);
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
      <p className="text-sm font-medium">Novo atributo</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-attribute-name">Nome</Label>
          <Input id="new-attribute-name" name="name" placeholder="Força" autoComplete="off" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-attribute-default">Valor padrão</Label>
          <Input id="new-attribute-default" name="defaultValue" type="number" className="w-28" defaultValue={0} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-attribute-description">Descrição (opcional)</Label>
        <Textarea id="new-attribute-description" name="description" rows={2} />
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

export function AttributeList({
  campaignId,
  attributes,
  referencingFormulasByKey,
  canManage,
}: {
  campaignId: string;
  attributes: AttributeDef[];
  referencingFormulasByKey: Record<string, string[]>;
  canManage: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {attributes.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum atributo criado ainda.</p>
      )}
      {attributes.map((attribute) => (
        <AttributeRow
          key={attribute.id}
          attribute={attribute}
          campaignId={campaignId}
          referencingFormulas={referencingFormulasByKey[attribute.key] ?? []}
          canManage={canManage}
        />
      ))}
      {canManage && <AddAttributeForm campaignId={campaignId} />}
    </div>
  );
}
