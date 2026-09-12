"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Plus, X } from "lucide-react";

import type { ChecklistItem } from "@/generated/prisma/client";
import {
  addChecklistItemAction,
  deleteChecklistItemAction,
  toggleChecklistItemAction,
} from "@/modules/preparation/session-plans/checklist-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function ChecklistRow({
  item,
  campaignId,
  sessionPlanId,
}: {
  item: ChecklistItem;
  campaignId: string;
  sessionPlanId: string;
}) {
  const [isToggling, startToggleTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  return (
    <li className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
      <input
        type="checkbox"
        checked={item.done}
        disabled={isToggling}
        onChange={() => startToggleTransition(() => toggleChecklistItemAction(campaignId, sessionPlanId, item.id))}
        className="size-4 shrink-0 accent-primary"
      />
      <span className={cn("min-w-0 flex-1", item.done && "text-muted-foreground line-through")}>{item.label}</span>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => startDeleteTransition(() => deleteChecklistItemAction(campaignId, sessionPlanId, item.id))}
        className="shrink-0 rounded p-1 text-muted-foreground opacity-60 transition-opacity hover:bg-surface-elevated hover:opacity-100"
        aria-label="Remover item"
      >
        <X className="size-3.5" />
      </button>
    </li>
  );
}

function AddChecklistItemForm({ campaignId, sessionPlanId }: { campaignId: string; sessionPlanId: string }) {
  const action = addChecklistItemAction.bind(null, campaignId, sessionPlanId);
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
      <div className="flex gap-2">
        <Input name="label" placeholder="Novo item…" className="flex-1" autoComplete="off" />
        <Button type="submit" variant="outline" disabled={pending}>
          <Plus className="size-4" /> {pending ? "Salvando…" : "Adicionar"}
        </Button>
      </div>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}

export function SessionChecklist({
  items,
  campaignId,
  sessionPlanId,
}: {
  items: ChecklistItem[];
  campaignId: string;
  sessionPlanId: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => (
            <ChecklistRow key={item.id} item={item} campaignId={campaignId} sessionPlanId={sessionPlanId} />
          ))}
        </ul>
      )}
      <AddChecklistItemForm campaignId={campaignId} sessionPlanId={sessionPlanId} />
    </div>
  );
}
