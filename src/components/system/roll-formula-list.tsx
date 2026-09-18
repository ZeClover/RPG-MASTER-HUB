"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { AlertTriangle, Check, Pencil, Plus, Trash2, X } from "lucide-react";

import type { RollFormulaDef } from "@/generated/prisma/client";
import {
  createRollFormulaAction,
  deleteRollFormulaAction,
  updateRollFormulaAction,
} from "@/modules/gametools/system/formula-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormulaTestDialog } from "@/components/system/formula-test-dialog";
import { useInlineEditAction } from "@/components/system/use-inline-edit-action";

function FormulaRow({
  formula,
  campaignId,
  unknownTokens,
  tokenDefaults,
  canManage,
}: {
  formula: RollFormulaDef;
  campaignId: string;
  unknownTokens: string[];
  tokenDefaults: Record<string, number>;
  canManage: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { handleSubmit, result, isPending } = useInlineEditAction(
    (formData) => updateRollFormulaAction(campaignId, formula.id, undefined, formData),
    () => setIsEditing(false),
  );

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border border-border p-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`name-${formula.id}`}>Nome</Label>
          <Input id={`name-${formula.id}`} name="name" defaultValue={formula.name} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`formula-${formula.id}`}>Fórmula</Label>
          <Input id={`formula-${formula.id}`} name="formula" defaultValue={formula.formula} className="font-mono" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`description-${formula.id}`}>Descrição</Label>
          <Textarea id={`description-${formula.id}`} name="description" rows={2} defaultValue={formula.description ?? ""} />
        </div>
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
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{formula.name}</span>
          <code className="rounded bg-surface-elevated px-1.5 py-0.5 text-xs">{formula.formula}</code>
          {unknownTokens.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="size-3" /> Token desconhecido: {unknownTokens.map((t) => `{${t}}`).join(", ")}
            </Badge>
          )}
        </div>
        {formula.description && <p className="mt-1 text-xs text-muted-foreground">{formula.description}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <FormulaTestDialog formulaName={formula.name} formula={formula.formula} tokenDefaults={tokenDefaults} />
        {canManage && (
          <>
            <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
              <Pencil className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Excluir a fórmula "${formula.name}"?`}
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={() => deleteRollFormulaAction(campaignId, formula.id)}
      />
    </div>
  );
}

function AddFormulaForm({ campaignId }: { campaignId: string }) {
  const action = createRollFormulaAction.bind(null, campaignId);
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
      <p className="text-sm font-medium">Nova fórmula</p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-formula-name">Nome</Label>
        <Input id="new-formula-name" name="name" placeholder="Teste de Força" autoComplete="off" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-formula-formula">Fórmula</Label>
        <Input id="new-formula-formula" name="formula" placeholder="1d20 + {forca}" autoComplete="off" className="font-mono" />
        <p className="text-xs text-muted-foreground">
          Use <code className="font-mono">{"{key}"}</code> para referenciar um atributo ou perícia (ex.: <code className="font-mono">1d20 + {"{forca}"}</code>).
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-formula-description">Descrição (opcional)</Label>
        <Textarea id="new-formula-description" name="description" rows={2} />
      </div>
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

export function RollFormulaList({
  campaignId,
  formulas,
  unknownTokensByFormula,
  tokenDefaults,
  canManage,
}: {
  campaignId: string;
  formulas: RollFormulaDef[];
  unknownTokensByFormula: Record<string, string[]>;
  tokenDefaults: Record<string, number>;
  canManage: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {formulas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma fórmula criada ainda.</p>}
      {formulas.map((formula) => (
        <FormulaRow
          key={formula.id}
          formula={formula}
          campaignId={campaignId}
          unknownTokens={unknownTokensByFormula[formula.id] ?? []}
          tokenDefaults={tokenDefaults}
          canManage={canManage}
        />
      ))}
      {canManage && <AddFormulaForm campaignId={campaignId} />}
    </div>
  );
}
