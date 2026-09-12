"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Plus, X } from "lucide-react";

import type { RollTableEntry, RollTableKind } from "@/generated/prisma/client";
import { addRollTableEntryAction, deleteRollTableEntryAction } from "@/modules/gametools/roll-tables/entry-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EntryListProps {
  entries: RollTableEntry[];
  campaignId: string;
  kind: RollTableKind;
  tableId: string;
  /** Rótulo do campo de peso: "Peso" na Table Builder, "Chance" no Loot Generator — mesmo número, outro nome. */
  weightLabel: string;
  /** "Entrada" na Table Builder, "Item" no Loot Generator — mesmo campo, outro nome. */
  entryLabel?: string;
}

function EntryRow({
  entry,
  campaignId,
  kind,
  tableId,
  weightLabel,
}: {
  entry: RollTableEntry;
  campaignId: string;
  kind: RollTableKind;
  tableId: string;
  weightLabel: string;
}) {
  const [isDeleting, startDeleteTransition] = useTransition();

  return (
    <li className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
      <span className="min-w-0 flex-1 truncate">{entry.label}</span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {weightLabel}: {entry.weight}
      </span>
      <button
        type="button"
        disabled={isDeleting}
        onClick={() => startDeleteTransition(() => deleteRollTableEntryAction(campaignId, kind, tableId, entry.id))}
        className="shrink-0 rounded p-1 text-muted-foreground opacity-60 transition-opacity hover:bg-surface-elevated hover:opacity-100"
        aria-label={`Remover entrada ${entry.label}`}
      >
        <X className="size-3.5" />
      </button>
    </li>
  );
}

function AddEntryForm({
  campaignId,
  kind,
  tableId,
  weightLabel,
  entryLabel,
}: {
  campaignId: string;
  kind: RollTableKind;
  tableId: string;
  weightLabel: string;
  entryLabel: string;
}) {
  const action = addRollTableEntryAction.bind(null, campaignId, kind, tableId);
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
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-40 flex-1 flex-col gap-1.5">
          <Label htmlFor="label">{entryLabel}</Label>
          <Input id="label" name="label" placeholder="Texto sorteável…" autoComplete="off" />
        </div>
        <div className="flex w-28 flex-col gap-1.5">
          <Label htmlFor="weight">{weightLabel}</Label>
          <Input id="weight" name="weight" type="number" min={1} max={1000} defaultValue={1} />
        </div>
        <Button type="submit" variant="outline" disabled={pending}>
          <Plus className="size-4" /> {pending ? "Salvando…" : "Adicionar"}
        </Button>
      </div>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}

export function RollTableEntryList({
  entries,
  campaignId,
  kind,
  tableId,
  weightLabel,
  entryLabel = "Entrada",
}: EntryListProps) {
  return (
    <div className="flex flex-col gap-3">
      {entries.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              campaignId={campaignId}
              kind={kind}
              tableId={tableId}
              weightLabel={weightLabel}
            />
          ))}
        </ul>
      )}
      <AddEntryForm campaignId={campaignId} kind={kind} tableId={tableId} weightLabel={weightLabel} entryLabel={entryLabel} />
    </div>
  );
}
