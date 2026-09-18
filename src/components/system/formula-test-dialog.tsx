"use client";

import { useMemo, useState } from "react";
import { Dices } from "lucide-react";

import { formatDiceResult } from "@/lib/dice";
import { evaluateFormula, extractFormulaTokens, type EvaluateFormulaResult } from "@/lib/formula";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * "Testar fórmula" (Fase 13, Part 4, ver ARCHITECTURE.md) — o mestre digita
 * valores manuais para cada token e rola client-side com `evaluateFormula`,
 * mesmo padrão já aceito de rolagem no cliente de `dice-roller.tsx` (Modo
 * Sessão). Deliberadamente NÃO grava nada — nem `SessionLogEntry`, nem
 * qualquer outro estado: é uma prévia de builder, não uma rolagem real de
 * mesa (isso é trabalho da Fase 14, quando fórmulas passam a ler valores de
 * um `Character` de verdade).
 */
export function FormulaTestDialog({ formulaName, formula, tokenDefaults }: { formulaName: string; formula: string; tokenDefaults: Record<string, number> }) {
  const tokens = useMemo(() => extractFormulaTokens(formula), [formula]);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, number>>({});
  const [result, setResult] = useState<EvaluateFormulaResult | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setValues(Object.fromEntries(tokens.map((token) => [token, tokenDefaults[token] ?? 0])));
      setResult(null);
    }
  }

  function roll() {
    setResult(evaluateFormula(formula, values));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Dices className="size-4" /> Testar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Testar &ldquo;{formulaName}&rdquo;</DialogTitle>
          <DialogDescription asChild>
            <code className="font-mono text-xs">{formula}</code>
          </DialogDescription>
        </DialogHeader>

        {tokens.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {tokens.map((token) => (
              <div key={token} className="flex flex-col gap-1.5">
                <Label htmlFor={`test-token-${token}`} className="font-mono">
                  {"{" + token + "}"}
                </Label>
                <Input
                  id={`test-token-${token}`}
                  type="number"
                  value={values[token] ?? 0}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, [token]: Number(event.target.value) || 0 }))
                  }
                />
              </div>
            ))}
          </div>
        )}

        <Button type="button" onClick={roll}>
          <Dices className="size-4" /> Rolar
        </Button>

        {result && !result.ok && <p className="text-sm text-destructive">{result.error}</p>}
        {result?.ok && (
          <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface-elevated p-3 text-sm">
            <p className="text-muted-foreground">{formatDiceResult(result.diceResult)}</p>
            <p className="text-muted-foreground">
              Modificadores: {result.modifierTotal >= 0 ? `+${result.modifierTotal}` : result.modifierTotal}
            </p>
            <p className="text-lg font-semibold">Total: {result.total}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">Rolagem de teste — não é salva na sessão.</p>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
