"use client";

import { useState, useTransition } from "react";
import { Dices } from "lucide-react";

import { DICE_QUICK_PRESETS, formatDiceResult, rollDice } from "@/lib/dice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DiceRollerProps {
  onRoll: (resultText: string) => void;
}

export function DiceRoller({ onRoll }: DiceRollerProps) {
  const [notation, setNotation] = useState("1d20");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function roll(value: string) {
    const result = rollDice(value);
    if (!result) {
      setError("Notação inválida. Use algo como 2d6+3.");
      return;
    }
    setError(null);
    startTransition(() => onRoll(formatDiceResult(result)));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={notation}
          onChange={(event) => setNotation(event.target.value)}
          placeholder="2d6+3"
          className="flex-1"
        />
        <Button type="button" disabled={isPending} onClick={() => roll(notation)}>
          <Dices className="size-4" /> Rolar
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-1.5">
        {DICE_QUICK_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            disabled={isPending}
            onClick={() => roll(preset)}
            className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-elevated"
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
