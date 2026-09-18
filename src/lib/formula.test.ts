import { describe, expect, it } from "vitest";

import { evaluateFormula, extractFormulaTokens, substituteFormulaTokens, validateFormulaTokens } from "@/lib/formula";

describe("extractFormulaTokens", () => {
  it("encontra todo token {key} numa fórmula", () => {
    expect(extractFormulaTokens("1d20 + {forca} + {treinamento}")).toEqual(["forca", "treinamento"]);
  });

  it("devolve lista vazia quando não há token", () => {
    expect(extractFormulaTokens("1d20 + 3")).toEqual([]);
  });

  it("deduplica tokens repetidos, mantendo a ordem da primeira aparição", () => {
    expect(extractFormulaTokens("{forca} + {destreza} + {forca}")).toEqual(["forca", "destreza"]);
  });
});

describe("substituteFormulaTokens", () => {
  it("substitui cada token pelo valor correspondente", () => {
    expect(substituteFormulaTokens("1d20 + {forca} + {treinamento}", { forca: 3, treinamento: 2 })).toBe(
      "1d20 + 3 + 2",
    );
  });

  it("usa 0 para valores ausentes", () => {
    expect(substituteFormulaTokens("1d20 + {forca}", {})).toBe("1d20 + 0");
  });

  it("aceita valores negativos", () => {
    expect(substituteFormulaTokens("1d20 + {forca}", { forca: -2 })).toBe("1d20 + -2");
  });
});

describe("validateFormulaTokens", () => {
  it("devolve lista vazia quando todo token é conhecido", () => {
    expect(validateFormulaTokens("1d20 + {forca}", new Set(["forca", "destreza"]))).toEqual([]);
  });

  it("devolve os tokens desconhecidos", () => {
    expect(validateFormulaTokens("1d20 + {forca} + {sorte}", new Set(["forca"]))).toEqual(["sorte"]);
  });
});

describe("evaluateFormula", () => {
  it("avalia uma rolagem simples com um token, ponta a ponta", () => {
    const result = evaluateFormula("1d20 + {forca}", { forca: 3 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.diceResult.rolls).toHaveLength(1);
    expect(result.diceResult.rolls[0]).toBeGreaterThanOrEqual(1);
    expect(result.diceResult.rolls[0]).toBeLessThanOrEqual(20);
    expect(result.modifierTotal).toBe(3);
    expect(result.total).toBe(result.diceResult.total + result.modifierTotal);
    expect(result.notation).toBe("1d20 + 3");
  });

  it("soma múltiplos tokens/modificadores, tolerando espaços e sinais soltos", () => {
    const result = evaluateFormula("1d20 +  {forca} + {treinamento} + -2", { forca: 3, treinamento: 5 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // 3 (força) + 5 (treinamento) + (-2) = 6
    expect(result.modifierTotal).toBe(6);
    expect(result.total).toBe(result.diceResult.total + 6);
  });

  it("usa 0 para token sem valor informado", () => {
    const result = evaluateFormula("1d6 + {sorte}", {});
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.modifierTotal).toBe(0);
  });

  it("rejeita fórmula sem nenhuma rolagem de dados", () => {
    const result = evaluateFormula("{forca} + {treinamento}", { forca: 3, treinamento: 2 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/exatamente uma rolagem/);
  });

  it("rejeita fórmula com mais de uma rolagem de dados", () => {
    const result = evaluateFormula("1d20 + 2d6", {});
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/só pode ter uma rolagem/);
  });

  it("rejeita notação de dados fora dos limites de rollDice (ex.: lados > 100)", () => {
    const result = evaluateFormula("1d999", {});
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/Notação de dados inválida/);
  });
});
