/**
 * Parser/roller de notação de dados (`2d6+3`, `1d20`, `4d6-1`) — puro, sem
 * I/O, para poder rodar tanto no servidor quanto offline no cliente (o Modo
 * Sessão precisa rolar dados mesmo sem rede).
 */
export interface DiceRollResult {
  notation: string;
  count: number;
  sides: number;
  modifier: number;
  rolls: number[];
  total: number;
}

const DICE_PATTERN = /^(\d{1,2})d(\d{1,3})\s*([+-]\s*\d{1,3})?$/i;

export function parseDiceNotation(notation: string): { count: number; sides: number; modifier: number } | null {
  const match = notation.trim().replace(/\s+/g, "").match(DICE_PATTERN);
  if (!match) return null;

  const count = Number(match[1]);
  const sides = Number(match[2]);
  const modifier = match[3] ? Number(match[3].replace(/\s+/g, "")) : 0;

  if (count < 1 || count > 20 || sides < 2 || sides > 100) return null;

  return { count, sides, modifier };
}

export function rollDice(notation: string): DiceRollResult | null {
  const parsed = parseDiceNotation(notation);
  if (!parsed) return null;

  const { count, sides, modifier } = parsed;
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;

  return { notation: notation.trim(), count, sides, modifier, rolls, total };
}

export function formatDiceResult(result: DiceRollResult): string {
  const modifierText = result.modifier !== 0 ? (result.modifier > 0 ? ` +${result.modifier}` : ` ${result.modifier}`) : "";
  return `${result.notation}: [${result.rolls.join(", ")}]${modifierText} = ${result.total}`;
}

export const DICE_QUICK_PRESETS = ["1d4", "1d6", "1d8", "1d10", "1d12", "1d20", "1d100", "2d6"];
