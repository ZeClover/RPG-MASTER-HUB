import { describe, expect, it } from "vitest";

import { formatDiceResult, parseDiceNotation, rollDice } from "@/lib/dice";

describe("parseDiceNotation", () => {
  it("aceita notações simples sem modificador", () => {
    expect(parseDiceNotation("1d20")).toEqual({ count: 1, sides: 20, modifier: 0 });
    expect(parseDiceNotation("2d6")).toEqual({ count: 2, sides: 6, modifier: 0 });
  });

  it("aceita modificador positivo e negativo", () => {
    expect(parseDiceNotation("2d6+3")).toEqual({ count: 2, sides: 6, modifier: 3 });
    expect(parseDiceNotation("4d6-1")).toEqual({ count: 4, sides: 6, modifier: -1 });
  });

  it("ignora espaços em qualquer posição", () => {
    expect(parseDiceNotation(" 1d20 ")).toEqual({ count: 1, sides: 20, modifier: 0 });
    expect(parseDiceNotation("1d20 + 3")).toEqual({ count: 1, sides: 20, modifier: 3 });
    expect(parseDiceNotation("1d20 - 3")).toEqual({ count: 1, sides: 20, modifier: -3 });
  });

  it("é case-insensitive para o 'd'", () => {
    expect(parseDiceNotation("1D20")).toEqual({ count: 1, sides: 20, modifier: 0 });
  });

  it("aceita os limites (boundary) de count e sides", () => {
    expect(parseDiceNotation("1d2")).toEqual({ count: 1, sides: 2, modifier: 0 }); // sides mínimo
    expect(parseDiceNotation("20d100")).toEqual({ count: 20, sides: 100, modifier: 0 }); // count e sides máximos
  });

  it("rejeita count fora do limite (0 ou > 20)", () => {
    expect(parseDiceNotation("0d6")).toBeNull();
    expect(parseDiceNotation("21d6")).toBeNull();
  });

  it("rejeita sides fora do limite (< 2 ou > 100)", () => {
    expect(parseDiceNotation("1d1")).toBeNull();
    expect(parseDiceNotation("1d101")).toBeNull();
  });

  it("rejeita notações inválidas", () => {
    expect(parseDiceNotation("")).toBeNull();
    expect(parseDiceNotation("abc")).toBeNull();
    expect(parseDiceNotation("d20")).toBeNull();
    expect(parseDiceNotation("1d")).toBeNull();
    expect(parseDiceNotation("1d20+")).toBeNull();
    expect(parseDiceNotation("1d20*2")).toBeNull();
  });
});

describe("rollDice", () => {
  it("retorna null para notação inválida", () => {
    expect(rollDice("nao-e-dado")).toBeNull();
  });

  it("gera o número certo de rolagens, cada uma dentro do intervalo do dado", () => {
    const result = rollDice("3d6");
    expect(result).not.toBeNull();
    expect(result!.rolls).toHaveLength(3);
    for (const roll of result!.rolls) {
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(6);
    }
  });

  it("soma as rolagens mais o modificador no total", () => {
    const result = rollDice("4d6+2")!;
    const sumOfRolls = result.rolls.reduce((sum, roll) => sum + roll, 0);
    expect(result.total).toBe(sumOfRolls + 2);
  });

  it("respeita os limites de 1 rolagem (mínimo) e 20 rolagens (máximo)", () => {
    const single = rollDice("1d20")!;
    expect(single.rolls).toHaveLength(1);

    const max = rollDice("20d4")!;
    expect(max.rolls).toHaveLength(20);
  });
});

describe("formatDiceResult", () => {
  it("formata sem modificador", () => {
    const text = formatDiceResult({ notation: "1d20", count: 1, sides: 20, modifier: 0, rolls: [15], total: 15 });
    expect(text).toBe("1d20: [15] = 15");
  });

  it("formata com modificador positivo", () => {
    const text = formatDiceResult({
      notation: "2d6+3",
      count: 2,
      sides: 6,
      modifier: 3,
      rolls: [4, 5],
      total: 12,
    });
    expect(text).toBe("2d6+3: [4, 5] +3 = 12");
  });

  it("formata com modificador negativo", () => {
    const text = formatDiceResult({
      notation: "4d6-1",
      count: 4,
      sides: 6,
      modifier: -1,
      rolls: [1, 2, 3, 4],
      total: 9,
    });
    expect(text).toBe("4d6-1: [1, 2, 3, 4] -1 = 9");
  });
});
