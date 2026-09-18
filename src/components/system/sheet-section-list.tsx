"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useActionState } from "react";
import { Check, LayoutTemplate, Pencil, Plus, Trash2, X } from "lucide-react";

import type { SheetSection, SheetSectionKind } from "@/generated/prisma/client";
import {
  createDefaultSheetSectionsAction,
  createSheetSectionAction,
  deleteSheetSectionAction,
  updateSheetSectionAction,
} from "@/modules/gametools/system/sheet-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useInlineEditAction } from "@/components/system/use-inline-edit-action";

const KIND_LABELS: Record<SheetSectionKind, string> = {
  ATTRIBUTES: "Atributos",
  RESOURCES: "Recursos",
  SKILLS: "Perícias",
  CONDITIONS: "Condições",
  FORMULAS: "Fórmulas de rolagem",
  CUSTOM_TEXT: "Texto livre",
};

const KIND_OPTIONS = Object.keys(KIND_LABELS) as SheetSectionKind[];

function KindSelect({ name, defaultValue, onChange }: { name: string; defaultValue: SheetSectionKind; onChange?: (kind: SheetSectionKind) => void }) {
  const [value, setValue] = useState<SheetSectionKind>(defaultValue);

  function handleChange(next: string) {
    const kind = next as SheetSectionKind;
    setValue(kind);
    onChange?.(kind);
  }

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {KIND_OPTIONS.map((kind) => (
            <SelectItem key={kind} value={kind}>
              {KIND_LABELS[kind]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

function SectionRow({ section, campaignId, canManage }: { section: SheetSection; campaignId: string; canManage: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [kind, setKind] = useState<SheetSectionKind>(section.kind);

  const { handleSubmit, result, isPending } = useInlineEditAction(
    (formData) => updateSheetSectionAction(campaignId, section.id, undefined, formData),
    () => setIsEditing(false),
  );

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border border-border p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`title-${section.id}`}>Título</Label>
            <Input id={`title-${section.id}`} name="title" defaultValue={section.title} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tipo</Label>
            <KindSelect name="kind" defaultValue={section.kind} onChange={setKind} />
          </div>
        </div>
        {kind === "CUSTOM_TEXT" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`customText-${section.id}`}>Texto da seção</Label>
            <Textarea id={`customText-${section.id}`} name="customText" rows={4} defaultValue={section.customText ?? ""} />
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="gmOnly" defaultChecked={section.gmOnly} className="size-4 accent-primary" />
            Seção secreta (só o mestre vê)
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
          <span className="font-medium">{section.title}</span>
          <Badge variant="secondary">{KIND_LABELS[section.kind]}</Badge>
          {section.gmOnly && <Badge variant="warning">Secreta</Badge>}
        </div>
        {section.kind === "CUSTOM_TEXT" && section.customText && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{section.customText}</p>
        )}
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
        title={`Excluir a seção "${section.title}"?`}
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={() => deleteSheetSectionAction(campaignId, section.id)}
      />
    </div>
  );
}

function AddSectionForm({ campaignId }: { campaignId: string }) {
  const action = createSheetSectionAction.bind(null, campaignId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [kind, setKind] = useState<SheetSectionKind>("ATTRIBUTES");
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state?.message) {
      formRef.current?.reset();
      setKind("ATTRIBUTES");
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
      <p className="text-sm font-medium">Nova seção</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-section-title">Título</Label>
          <Input id="new-section-title" name="title" placeholder="Atributos" autoComplete="off" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Tipo</Label>
          <KindSelect name="kind" defaultValue="ATTRIBUTES" onChange={setKind} />
        </div>
      </div>
      {kind === "CUSTOM_TEXT" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-section-customText">Texto da seção</Label>
          <Textarea id="new-section-customText" name="customText" rows={4} />
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="gmOnly" className="size-4 accent-primary" />
          Seção secreta (só o mestre vê)
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

function DefaultSectionsButton({ campaignId }: { campaignId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-border p-4">
      <p className="text-sm text-muted-foreground">
        Nenhuma seção criada ainda. Comece pelas seções padrão (Atributos, Recursos, Perícias, Condições e
        Fórmulas) e ajuste depois.
      </p>
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await createDefaultSheetSectionsAction(campaignId);
            setError(result?.error ?? null);
          })
        }
      >
        <LayoutTemplate className="size-4" /> {isPending ? "Criando…" : "Criar seções padrão"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function SheetSectionList({
  campaignId,
  sections,
  canManage,
}: {
  campaignId: string;
  sections: SheetSection[];
  canManage: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {sections.length === 0 && canManage && <DefaultSectionsButton campaignId={campaignId} />}
      {sections.length === 0 && !canManage && (
        <p className="text-sm text-muted-foreground">O mestre ainda não montou a ficha desta campanha.</p>
      )}
      {sections.map((section) => (
        <SectionRow key={section.id} section={section} campaignId={campaignId} canManage={canManage} />
      ))}
      {canManage && <AddSectionForm campaignId={campaignId} />}
    </div>
  );
}
