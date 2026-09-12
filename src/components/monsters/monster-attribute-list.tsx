"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Plus, X } from "lucide-react";

import type { MonsterAttribute } from "@/generated/prisma/client";
import { addMonsterAttributeAction, deleteMonsterAttributeAction } from "@/modules/gametools/monsters/attribute-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function AttributeRow({
  attribute,
  campaignId,
  monsterId,
}: {
  attribute: MonsterAttribute;
  campaignId: string;
  monsterId: string;
}) {
  const [isDeleting, startDeleteTransition] = useTransition();

  return (
    <li className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
      <span className="min-w-0 flex-1 truncate font-medium">{attribute.key}</span>
      <span className="min-w-0 flex-[2] truncate text-muted-foreground">{attribute.value}</span>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => startDeleteTransition(() => deleteMonsterAttributeAction(campaignId, monsterId, attribute.id))}
        className="shrink-0 rounded p-1 text-muted-foreground opacity-60 transition-opacity hover:bg-surface-elevated hover:opacity-100"
        aria-label={`Remover atributo ${attribute.key}`}
      >
        <X className="size-3.5" />
      </button>
    </li>
  );
}

function AddAttributeForm({ campaignId, monsterId }: { campaignId: string; monsterId: string }) {
  const action = addMonsterAttributeAction.bind(null, campaignId, monsterId);
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
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Input name="key" placeholder="Atributo (ex.: HP)" className="w-40 flex-1" autoComplete="off" />
        <Input name="value" placeholder="Valor (ex.: 40)" className="flex-[2] basis-40" autoComplete="off" />
        <Button type="submit" variant="outline" disabled={pending}>
          <Plus className="size-4" /> {pending ? "Salvando…" : "Adicionar"}
        </Button>
      </div>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}

export function MonsterAttributeList({
  attributes,
  campaignId,
  monsterId,
}: {
  attributes: MonsterAttribute[];
  campaignId: string;
  monsterId: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {attributes.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {attributes.map((attribute) => (
            <AttributeRow key={attribute.id} attribute={attribute} campaignId={campaignId} monsterId={monsterId} />
          ))}
        </ul>
      )}
      <AddAttributeForm campaignId={campaignId} monsterId={monsterId} />
    </div>
  );
}
