"use client";

import { useEffect, useState, useTransition } from "react";
import { Dices, MessageSquare, Swords, Trash2 } from "lucide-react";

import type { SessionLogEntry } from "@/generated/prisma/client";
import { deleteLogEntryAction } from "@/modules/game/session-log/actions";
import { useOfflineSync } from "@/components/session-mode/use-offline-sync";
import { DiceRoller } from "@/components/session-mode/dice-roller";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";

interface LocalEntry {
  id: string;
  type: SessionLogEntry["type"];
  content: string;
  createdAt: Date;
  synced: boolean;
}

const ENTRY_ICONS: Record<SessionLogEntry["type"], typeof MessageSquare> = {
  NOTE: MessageSquare,
  DICE_ROLL: Dices,
  COMBAT_EVENT: Swords,
};

interface SessionLogPanelProps {
  campaignId: string;
  sessionPlanId?: string;
  initialEntries: SessionLogEntry[];
}

export function SessionLogPanel({ campaignId, sessionPlanId, initialEntries }: SessionLogPanelProps) {
  const [entries, setEntries] = useState<LocalEntry[]>(
    initialEntries.map((entry) => ({ ...entry, synced: true })),
  );
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const { queueOrRun } = useOfflineSync(campaignId);

  function addEntry(type: SessionLogEntry["type"], content: string) {
    const clientId = crypto.randomUUID();
    setEntries((prev) => [{ id: clientId, type, content, createdAt: new Date(), synced: false }, ...prev]);

    startTransition(() => {
      queueOrRun("createLogEntry", { type, content, clientId, sessionPlanId }).then(({ queued }) => {
        if (!queued) {
          setEntries((prev) => prev.map((entry) => (entry.id === clientId ? { ...entry, synced: true } : entry)));
        }
      });
    });
  }

  function handleAddNote() {
    if (!note.trim()) return;
    addEntry("NOTE", note.trim());
    setNote("");
  }

  useEffect(() => {
    function handleNpcCreated(event: Event) {
      const detail = (event as CustomEvent<{ id: string; name: string }>).detail;
      addEntry("NOTE", `NPC criado: ${detail.name}`);
    }
    function handleQueueFlushed() {
      setEntries((prev) => prev.map((entry) => ({ ...entry, synced: true })));
    }
    window.addEventListener("session-mode:npc-created", handleNpcCreated);
    window.addEventListener("session-mode:queue-flushed", handleQueueFlushed);
    return () => {
      window.removeEventListener("session-mode:npc-created", handleNpcCreated);
      window.removeEventListener("session-mode:queue-flushed", handleQueueFlushed);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- addEntry é recriada a cada render, mas só precisamos do listener uma vez
  }, []);

  function handleRemove(entryId: string) {
    setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    if (navigator.onLine) void deleteLogEntryAction(campaignId, entryId);
  }

  return (
    <Card className="flex flex-col gap-4 p-4">
      <h2 className="text-sm font-semibold">Registro da sessão</h2>

      <DiceRoller onRoll={(resultText) => addEntry("DICE_ROLL", resultText)} />

      <div className="flex gap-2">
        <Input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleAddNote();
          }}
          placeholder="Anotar algo que aconteceu…"
          className="flex-1"
        />
        <Button type="button" variant="outline" disabled={isPending} onClick={handleAddNote}>
          Anotar
        </Button>
      </div>

      <ul className="flex max-h-96 flex-col gap-1.5 overflow-y-auto">
        {entries.length === 0 && <p className="text-sm text-muted-foreground">Nada registrado ainda.</p>}
        {entries.map((entry) => {
          const Icon = ENTRY_ICONS[entry.type];
          return (
            <li
              key={entry.id}
              className="group flex items-start gap-2 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="break-words">{entry.content}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.synced ? formatRelativeTime(entry.createdAt) : "salvando quando reconectar…"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(entry.id)}
                className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-surface-elevated group-hover:opacity-100"
                aria-label="Remover entrada"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
