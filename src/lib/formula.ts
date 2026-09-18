/**
 * Avaliador seguro de fórmulas de rolagem do Construtor de Sistema (Fase 13,
 * ver ARCHITECTURE.md) — puro, sem I/O, para poder rodar tanto em Server
 * Actions quanto direto no cliente (mesmo espírito de `src/lib/dice.ts`, que
 * este módulo usa por baixo e nunca duplica).
 *
 * Deliberadamente SEM `eval()`/`Function()`/qualquer execução de código
 * dinâmico: uma fórmula é sempre "uma rolagem de dados + modificadores
 * inteiros somados/subtraídos" (ex.: `"1d20 + {forca} + {treinamento}"`) —
 * nunca uma expressão arbitrária. `{key}` é o token que referencia a `key`
 * de um `AttributeDef`/`SkillDef` da campanha.
 */
import { rollDice, type DiceRollResult } from "@/lib/dice";

const TOKEN_PATTERN = /\{([a-zA-Z0-9_-]+)\}/g;
/** Mesmo padrão `NdM` de `dice.ts` (`DICE_PATTERN`), mas buscado dentro de uma string maior — não ancorado à string inteira. */
const DICE_SUBSTRING_PATTERN = /\d{1,2}d\d{1,3}/gi;
/** Termo de modificador inteiro (`+3`, `- 2`, `+  5`) — o sinal é capturado à parte para tolerar espaços entre ele e o número. */
const MODIFIER_TERM_PATTERN = /([+-])\s*(\d+)/g;

export interface EvaluateFormulaSuccess {
  ok: true;
  /** Fórmula já com os tokens substituídos pelos valores informados — para exibição. */
  notation: string;
  diceResult: DiceRollResult;
  modifierTotal: number;
  total: number;
}

export interface EvaluateFormulaFailure {
  ok: false;
  error: string;
}

export type EvaluateFormulaResult = EvaluateFormulaSuccess | EvaluateFormulaFailure;

/** Encontra todo token `{key}` numa fórmula e devolve a lista única de chaves referenciadas, na ordem em que aparecem. */
export function extractFormulaTokens(formula: string): string[] {
  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const match of formula.matchAll(TOKEN_PATTERN)) {
    const key = match[1];
    if (!seen.has(key)) {
      seen.add(key);
      tokens.push(key);
    }
  }
  return tokens;
}

/** Substitui todo `{key}` pelo valor correspondente em `values` (0 quando ausente — a validação de tokens desconhecidos acontece à parte, em `validateFormulaTokens`, no momento de salvar). */
export function substituteFormulaTokens(formula: string, values: Record<string, number>): string {
  return formula.replace(TOKEN_PATTERN, (_match, key: string) => String(values[key] ?? 0));
}

/** Tokens da fórmula que não existem em `knownKeys` (vazio = fórmula válida) — usado em `createRollFormulaAction`/`updateRollFormulaAction` para rejeitar fórmulas que referenciam um atributo/perícia inexistente. */
export function validateFormulaTokens(formula: string, knownKeys: Set<string>): string[] {
  return extractFormulaTokens(formula).filter((token) => !knownKeys.has(token));
}

/**
 * Avalia uma fórmula já com valores concretos para os tokens: substitui,
 * localiza a ÚNICA rolagem de dados (ex.: `1d20`) dentro do resultado, rola
 * via `rollDice` (nunca reimplementa o RNG) e soma todo termo inteiro
 * `[+-] número` restante como modificador plano.
 */
export function evaluateFormula(formula: string, values: Record<string, number>): EvaluateFormulaResult {
  const substituted = substituteFormulaTokens(formula, values);

  const diceMatches = substituted.match(DICE_SUBSTRING_PATTERN);
  if (!diceMatches || diceMatches.length === 0) {
    return { ok: false, error: "A fórmula precisa ter exatamente uma rolagem de dados (ex.: 1d20)." };
  }
  if (diceMatches.length > 1) {
    return { ok: false, error: "A fórmula só pode ter uma rolagem de dados — encontramos mais de uma." };
  }

  const diceNotation = diceMatches[0];
  const diceResult = rollDice(diceNotation);
  if (!diceResult) {
    return { ok: false, error: `Notação de dados inválida: "${diceNotation}" (limites: 1-20 dados, 2-100 lados).` };
  }

  // `MODIFIER_TERM_PATTERN` exige um sinal `+`/`-` explícito antes de cada
  // número — sem isto, um termo que vem ANTES da rolagem de dados na fórmula
  // (ex.: "{forca} + 1d20") ficaria sem sinal algum depois de remover "1d20"
  // do início da string, e seria descartado silenciosamente da soma. Um "+"
  // implícito no início do resto normaliza isso, para que a posição da
  // rolagem de dados na fórmula nunca importe.
  const remainder = substituted.replace(diceNotation, "");
  const normalizedRemainder = /^\s*[+-]/.test(remainder) ? remainder : `+${remainder}`;
  let modifierTotal = 0;
  for (const match of normalizedRemainder.matchAll(MODIFIER_TERM_PATTERN)) {
    const sign = match[1] === "-" ? -1 : 1;
    modifierTotal += sign * Number(match[2]);
  }

  return {
    ok: true,
    notation: substituted.trim(),
    diceResult,
    modifierTotal,
    total: diceResult.total + modifierTotal,
  };
}
