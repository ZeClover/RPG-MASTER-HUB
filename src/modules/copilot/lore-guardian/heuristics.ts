/**
 * Lore Guardian (Fase 8, ver ARCHITECTURE.md, seção 19) — heurísticas puras,
 * sem I/O, mesma filosofia de `src/lib/dice.ts` (Fase 3) e `roll-tables/roll.ts`
 * (Fase 6): testáveis isoladamente, sem acesso a banco. Nenhuma das duas
 * heurísticas abaixo "entende" o texto — são comparação de string e palavras-
 * chave, admitidamente imperfeitas (documentado em detalhe em ARCHITECTURE.md).
 */

/** Remove acentos, baixa a caixa e normaliza espaços — para comparar "Vilão" e "vilao" como o mesmo texto. */
export function normalizeForComparison(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Distância de edição (Levenshtein) — implementação própria de poucas linhas,
 * sem dependência nova (evitado de propósito: `leven` ou similar seriam uma
 * dependência inteira só para uma função de ~10 linhas).
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previousRow = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const currentRow = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow.push(Math.min(previousRow[j] + 1, currentRow[j - 1] + 1, previousRow[j - 1] + cost));
    }
    previousRow = currentRow;
  }
  return previousRow[b.length];
}

export type NameMatchKind = "EXACT" | "SIMILAR";

/**
 * Compara dois nomes já normalizados. `EXACT` quando são idênticos após
 * normalização (ex.: "Vilão" e "VILÃO"); `SIMILAR` quando a distância de
 * edição é pequena o bastante para parecer erro de digitação/duplicata (ex.:
 * "Franz" e "Frans") — limiar deliberadamente conservador (distância <= 2 E
 * <= 34% do tamanho do maior nome) para não afogar o mestre em falsos
 * positivos entre nomes só coincidentemente parecidos ("Elara"/"Elana").
 * Nomes curtos (< 4 caracteres normalizados) nunca disparam "similar" — a
 * distância relativa de nomes curtos é alta demais para o cálculo dizer
 * qualquer coisa útil.
 */
export function matchNames(normalizedA: string, normalizedB: string): NameMatchKind | null {
  if (!normalizedA || !normalizedB) return null;
  if (normalizedA === normalizedB) return "EXACT";

  if (normalizedA.length < 4 || normalizedB.length < 4) return null;

  const distance = levenshteinDistance(normalizedA, normalizedB);
  const longer = Math.max(normalizedA.length, normalizedB.length);
  if (distance <= 2 && distance / longer <= 0.34) return "SIMILAR";

  return null;
}

/**
 * Pares de palavras-chave (pt-BR) tratadas como "opostas" para detectar
 * relacionamentos potencialmente contraditórios entre o MESMO par de
 * entidades (ex.: uma linha "é aliado de" e outra "é inimigo de" entre A e
 * B). Deliberadamente pequena e literal — é comparação de substring em cima
 * do campo `Relationship.type` (texto livre), não compreensão semântica.
 * Duas entidades podem legitimamente ter as duas relações ao mesmo tempo em
 * momentos diferentes da campanha (ex.: eram aliados, agora são inimigos, e o
 * mestre não apagou a relação antiga) — por isso isto é sempre sinalizado
 * como "pode precisar de revisão", nunca como um erro.
 */
export const OPPOSITE_KEYWORD_GROUPS: [string[], string[]][] = [
  [["aliad"], ["inimig"]],
  [["amig"], ["inimig"]],
  [["ama", "amor"], ["odeia", "odio", "ódio"]],
  [["confia"], ["desconfia", "traiu", "trair", "traicao", "traição"]],
  [["leal"], ["traiu", "trair", "traidor", "traicao", "traição"]],
  [["protege", "protetor"], ["ataca", "ataque", "agride", "agressor"]],
  [["casad", "conjuge", "cônjuge"], ["divorciad", "separou", "separad"]],
  [["vivo", "viva"], ["morto", "morta", "morreu"]],
];

/**
 * Retorna as duas palavras-chave que casaram (uma de cada grupo oposto) se
 * `typeA`/`typeB` (dois `Relationship.type` livres) pertencerem a grupos
 * opostos entre si, ou `null` se não houver correspondência.
 */
export function findOppositeKeywordMatch(typeA: string, typeB: string): [string, string] | null {
  const normalizedA = normalizeForComparison(typeA);
  const normalizedB = normalizeForComparison(typeB);

  for (const [groupOne, groupTwo] of OPPOSITE_KEYWORD_GROUPS) {
    const aInOne = groupOne.find((keyword) => normalizedA.includes(keyword));
    const bInTwo = groupTwo.find((keyword) => normalizedB.includes(keyword));
    if (aInOne && bInTwo) return [aInOne, bInTwo];

    const aInTwo = groupTwo.find((keyword) => normalizedA.includes(keyword));
    const bInOne = groupOne.find((keyword) => normalizedB.includes(keyword));
    if (aInTwo && bInOne) return [aInTwo, bInOne];
  }

  return null;
}
