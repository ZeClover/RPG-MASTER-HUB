"use client";

import { useState, useTransition } from "react";
import { ChevronRight, Plus, Swords, X } from "lucide-react";

import type { Combatant, CombatEncounter } from "@/generated/prisma/client";
import {
  advanceTurnAction,
  endEncounterAction,
  startEncounterAction,
} from "@/modules/game/combat/actions";
import { useOfflineSync } from "@/components/session-mode/use-offline-sync";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type EncounterWithCombatants = CombatEncounter & { combatants: Combatant[] };

function CombatantRow({
  combatant,
  isActive,
  onUpdate,
  onRemove,
}: {
  combatant: Combatant;
  isActive: boolean;
  onUpdate: (patch: { hpCurrent?: number; conditions?: string }) => void;
  onRemove: () => void;
}) {
  const [hp, setHp] = useState(combatant.hpCurrent?.toString() ?? "");
  const [conditions, setConditions] = useState(combatant.conditions ?? "");

  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
        isActive ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      {isActive && <ChevronRight className="size-4 shrink-0 text-primary" />}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {combatant.name} <span className="text-xs text-muted-foreground">({combatant.initiative})</span>
        </p>
        <Input
          value={conditions}
          onChange={(event) => setConditions(event.target.value)}
          onBlur={() => onUpdate({ conditions })}
          placeholder="Condições…"
          className="mt-1 h-7 text-xs"
        />
      </div>
      {combatant.hpMax != null && (
        <div className="flex shrink-0 items-center gap-1 text-xs">
          <Input
            type="number"
            value={hp}
            onChange={(event) => setHp(event.target.value)}
            onBlur={() => onUpdate({ hpCurrent: hp === "" ? undefined : Number(hp) })}
            className="h-7 w-14 text-center"
          />
          <span className="text-muted-foreground">/ {combatant.hpMax}</span>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded p-1 text-muted-foreground opacity-60 hover:bg-surface-elevated hover:opacity-100"
        aria-label="Remover combatente"
      >
        <X className="size-3.5" />
      </button>
    </li>
  );
}

function AddCombatantForm({ onAdd }: { onAdd: (input: { name: string; type: "PC" | "NPC"; initiative: number; hpMax?: number }) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"PC" | "NPC">("NPC");
  const [initiative, setInitiative] = useState("0");
  const [hpMax, setHpMax] = useState("");

  function submit() {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      type,
      initiative: Number(initiative) || 0,
      hpMax: hpMax ? Number(hpMax) : undefined,
    });
    setName("");
    setInitiative("0");
    setHpMax("");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome" className="w-32 flex-1" />
      <Select value={type} onValueChange={(value) => setType(value as "PC" | "NPC")}>
        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="NPC">NPC</SelectItem>
          <SelectItem value="PC">PC</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="number"
        value={initiative}
        onChange={(event) => setInitiative(event.target.value)}
        placeholder="Iniciativa"
        className="w-20"
      />
      <Input type="number" value={hpMax} onChange={(event) => setHpMax(event.target.value)} placeholder="HP" className="w-16" />
      <Button type="button" size="sm" onClick={submit}>
        <Plus className="size-4" /> Adicionar
      </Button>
    </div>
  );
}

interface CombatTrackerPanelProps {
  campaignId: string;
  sessionPlanId?: string;
  initialEncounter: EncounterWithCombatants | null;
}

export function CombatTrackerPanel({ campaignId, sessionPlanId, initialEncounter }: CombatTrackerPanelProps) {
  const [encounter, setEncounter] = useState(initialEncounter);
  const [isPending, startTransition] = useTransition();
  const { queueOrRun } = useOfflineSync(campaignId);

  function handleStart() {
    startTransition(async () => {
      const created = await startEncounterAction(campaignId, "Combate", sessionPlanId);
      setEncounter({ ...created, combatants: [] });
    });
  }

  function handleEnd() {
    if (!encounter) return;
    startTransition(async () => {
      await endEncounterAction(campaignId, encounter.id);
      setEncounter(null);
    });
  }

  function handleAddCombatant(input: { name: string; type: "PC" | "NPC"; initiative: number; hpMax?: number }) {
    if (!encounter) return;
    // O id é gerado aqui, no cliente, e é o MESMO enviado ao servidor (nunca
    // um id de servidor gerado depois) — se não fosse assim, uma atualização
    // de HP feita logo em seguida (comum: adicionar um combatente e já
    // ajustar a vida dele) teria como alvo um id que o servidor nunca viu,
    // e falharia silenciosamente tanto online quanto ao reenviar da fila
    // offline (mesmo problema que `SessionLogEntry.clientId` resolve no log).
    const id = crypto.randomUUID();
    const optimistic: Combatant = {
      id,
      encounterId: encounter.id,
      name: input.name,
      type: input.type,
      initiative: input.initiative,
      hpCurrent: input.hpMax ?? null,
      hpMax: input.hpMax ?? null,
      conditions: null,
      order: encounter.combatants.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setEncounter((prev) =>
      prev
        ? { ...prev, combatants: [...prev.combatants, optimistic].sort((a, b) => b.initiative - a.initiative) }
        : prev,
    );
    void queueOrRun("addCombatant", { id, encounterId: encounter.id, ...input });
  }

  function handleUpdateCombatant(combatantId: string, patch: { hpCurrent?: number; conditions?: string }) {
    setEncounter((prev) =>
      prev
        ? {
            ...prev,
            combatants: prev.combatants.map((c) => (c.id === combatantId ? { ...c, ...patch } : c)),
          }
        : prev,
    );
    void queueOrRun("updateCombatant", { combatantId, ...patch });
  }

  function handleRemoveCombatant(combatantId: string) {
    setEncounter((prev) => (prev ? { ...prev, combatants: prev.combatants.filter((c) => c.id !== combatantId) } : prev));
    void queueOrRun("removeCombatant", { combatantId });
  }

  function handleAdvanceTurn() {
    if (!encounter || encounter.combatants.length === 0) return;
    const sorted = [...encounter.combatants].sort((a, b) => b.initiative - a.initiative);
    const currentIndex = sorted.findIndex((c) => c.id === encounter.activeCombatantId);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % sorted.length;
    const wrapped = currentIndex !== -1 && nextIndex === 0;
    setEncounter((prev) =>
      prev ? { ...prev, activeCombatantId: sorted[nextIndex].id, round: wrapped ? prev.round + 1 : prev.round } : prev,
    );
    startTransition(() => advanceTurnAction(campaignId, encounter.id));
  }

  if (!encounter) {
    return (
      <Card className="flex flex-col gap-3 p-4">
        <h2 className="text-sm font-semibold">Combate</h2>
        <p className="text-sm text-muted-foreground">Nenhum combate em andamento.</p>
        <Button type="button" disabled={isPending} onClick={handleStart} className="self-start">
          <Swords className="size-4" /> Iniciar combate
        </Button>
      </Card>
    );
  }

  const sortedCombatants = [...encounter.combatants].sort((a, b) => b.initiative - a.initiative);

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          {encounter.name} — Rodada {encounter.round}
        </h2>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={handleAdvanceTurn}>
            Próximo turno
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={handleEnd}>
            Encerrar
          </Button>
        </div>
      </div>

      <ul className="flex flex-col gap-1.5">
        {sortedCombatants.map((combatant) => (
          <CombatantRow
            key={combatant.id}
            combatant={combatant}
            isActive={combatant.id === encounter.activeCombatantId}
            onUpdate={(patch) => handleUpdateCombatant(combatant.id, patch)}
            onRemove={() => handleRemoveCombatant(combatant.id)}
          />
        ))}
      </ul>

      <AddCombatantForm onAdd={handleAddCombatant} />
    </Card>
  );
}
