"use client";

import { useState, useTransition } from "react";
import { Dices, NotebookPen } from "lucide-react";

import { rollRollTableAction } from "@/modules/gametools/roll-tables/roll-actions";
import { createLogEntryAction } from "@/modules/game/session-log/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RollTableRollerProps {
  campaignId: string;
  tableId: string;
  tableName: string;
  /** Loot Generator sorteia N itens de uma vez; Table Builder sempre sorteia 1 (uma "rolagem" de tabela). */
  allowCount?: boolean;
  entryCount: number;
}

export function RollTableRoller({ campaignId, tableId, tableName, allowCount = false, entryCount }: RollTableRollerProps) {
  const [count, setCount] = useState(1);
  const [results, setResults] = useState<{ id: string; label: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);
  const [isRolling, startRollTransition] = useTransition();
  const [isLogging, startLogTransition] = useTransition();

  function handleRoll() {
    setLogged(false);
    startRollTransition(async () => {
      const response = await rollRollTableAction(campaignId, tableId, allowCount ? count : 1);
      if (response.error) {
        setError(response.error);
        setResults(null);
        return;
      }
      setError(null);
      setResults(response.results);
    });
  }

  function handleLog() {
    if (!results || results.length === 0) return;
    const content = `Tabela "${tableName}": ${results.map((entry) => entry.label).join(", ")}`;
    startLogTransition(async () => {
      await createLogEntryAction(campaignId, { type: "NOTE", content });
      setLogged(true);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rolar</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        <div className="flex flex-wrap items-end gap-3">
          {allowCount && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="roll-count">Quantidade</Label>
              <Input
                id="roll-count"
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(event) => setCount(Math.min(20, Math.max(1, Number(event.target.value) || 1)))}
                className="w-24"
              />
            </div>
          )}
          <Button type="button" onClick={handleRoll} disabled={isRolling || entryCount === 0}>
            <Dices className="size-4" /> {isRolling ? "Rolando…" : "Rolar"}
          </Button>
        </div>

        {entryCount === 0 && <p className="text-xs text-muted-foreground">Adicione entradas para poder rolar.</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {results && results.length > 0 && (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-elevated p-3">
            <ul className="flex flex-col gap-1 text-sm font-medium">
              {results.map((entry, index) => (
                <li key={`${entry.id}-${index}`}>{entry.label}</li>
              ))}
            </ul>
            <div>
              <Button type="button" variant="outline" size="sm" onClick={handleLog} disabled={isLogging || logged}>
                <NotebookPen className="size-3.5" /> {logged ? "Registrado no log" : "Registrar no Log da Sessão"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
