"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import type { AttributeDef, SkillDef } from "@/generated/prisma/client";
import { createSkillAction, deleteSkillAction, updateSkillAction } from "@/modules/gametools/system/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useInlineEditAction } from "@/components/system/use-inline-edit-action";

type SkillWithAttribute = SkillDef & { relatedAttribute: AttributeDef | null };

function RelatedAttributeSelect({
  name,
  defaultValue,
  attributes,
}: {
  name: string;
  defaultValue?: string;
  attributes: AttributeDef[];
}) {
  const [value, setValue] = useState(defaultValue ?? "__none__");

  return (
    <>
      <input type="hidden" name={name} value={value === "__none__" ? "" : value} />
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger>
          <SelectValue placeholder="Sem atributo relacionado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Sem atributo relacionado</SelectItem>
          {attributes.map((attribute) => (
            <SelectItem key={attribute.id} value={attribute.id}>
              {attribute.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

function AffectedFormulasNotice({ names }: { names: string[] }) {
  if (names.length === 0) return "Excluir esta perícia não pode ser desfeita.";
  return (
    <>
      Excluir esta perícia não pode ser desfeita. Ela é referenciada por{" "}
      {names.length === 1 ? "esta fórmula" : "estas fórmulas"}: <strong>{names.join(", ")}</strong> — depois de
      excluir, o token correspondente vira &ldquo;0&rdquo; nelas (fórmula não quebra, mas o cálculo muda).
    </>
  );
}

function SkillRow({
  skill,
  campaignId,
  attributes,
  referencingFormulas,
  canManage,
}: {
  skill: SkillWithAttribute;
  campaignId: string;
  attributes: AttributeDef[];
  referencingFormulas: string[];
  canManage: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { handleSubmit, result, isPending } = useInlineEditAction(
    (formData) => updateSkillAction(campaignId, skill.id, undefined, formData),
    () => setIsEditing(false),
  );

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border border-border p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`name-${skill.id}`}>Nome</Label>
            <Input id={`name-${skill.id}`} name="name" defaultValue={skill.name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`defaultBonus-${skill.id}`}>Bônus padrão</Label>
            <Input
              id={`defaultBonus-${skill.id}`}
              name="defaultBonus"
              type="number"
              className="w-28"
              defaultValue={skill.defaultBonus}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Atributo relacionado</Label>
          <RelatedAttributeSelect name="relatedAttributeId" defaultValue={skill.relatedAttributeId ?? undefined} attributes={attributes} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="gmOnly" defaultChecked={skill.gmOnly} className="size-4 accent-primary" />
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
          <span className="font-medium">{skill.name}</span>
          <Badge variant="outline" className="font-mono">
            {"{" + skill.key + "}"}
          </Badge>
          {skill.gmOnly && <Badge variant="warning">Secreto</Badge>}
          <span className="text-xs text-muted-foreground">Bônus padrão: {skill.defaultBonus}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {skill.relatedAttribute ? `Relacionada a ${skill.relatedAttribute.name}` : "Sem atributo relacionado"}
        </p>
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
        title={`Excluir a perícia "${skill.name}"?`}
        description={<AffectedFormulasNotice names={referencingFormulas} />}
        confirmLabel="Excluir"
        onConfirm={() => deleteSkillAction(campaignId, skill.id)}
      />
    </div>
  );
}

function AddSkillForm({ campaignId, attributes }: { campaignId: string; attributes: AttributeDef[] }) {
  const action = createSkillAction.bind(null, campaignId);
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
      <p className="text-sm font-medium">Nova perícia</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-skill-name">Nome</Label>
          <Input id="new-skill-name" name="name" placeholder="Atletismo" autoComplete="off" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-skill-bonus">Bônus padrão</Label>
          <Input id="new-skill-bonus" name="defaultBonus" type="number" className="w-28" defaultValue={0} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Atributo relacionado (opcional)</Label>
        <RelatedAttributeSelect name="relatedAttributeId" attributes={attributes} />
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

export function SkillList({
  campaignId,
  skills,
  attributes,
  referencingFormulasByKey,
  canManage,
}: {
  campaignId: string;
  skills: SkillWithAttribute[];
  attributes: AttributeDef[];
  referencingFormulasByKey: Record<string, string[]>;
  canManage: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {skills.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma perícia criada ainda.</p>}
      {skills.map((skill) => (
        <SkillRow
          key={skill.id}
          skill={skill}
          campaignId={campaignId}
          attributes={attributes}
          referencingFormulas={referencingFormulasByKey[skill.key] ?? []}
          canManage={canManage}
        />
      ))}
      {canManage && <AddSkillForm campaignId={campaignId} attributes={attributes} />}
    </div>
  );
}
