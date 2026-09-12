/**
 * Sorteio ponderado — puro, sem I/O, mesma filosofia de `src/lib/dice.ts`
 * (Fase 3, seção 14.4): testável isoladamente e reutilizável tanto pelo
 * Table Builder quanto pelo Loot Generator, que reaproveitam o mesmo motor
 * (ver ARCHITECTURE.md, seção 17.3).
 */
export interface WeightedEntry {
  id: string;
  label: string;
  weight: number;
}

/**
 * Sorteia `count` entradas COM reposição (a mesma entrada pode sair mais de
 * uma vez) — corte de escopo deliberado: uma tabela "sem repetição" exigiria
 * remover e reponderar a cada sorteio, complexidade que nem um dado físico
 * nem a maioria das tabelas de mesa (loot, encontros aleatórios) pedem (ver
 * ARCHITECTURE.md, seção 17.3).
 */
export function rollWeightedEntries(entries: WeightedEntry[], count: number): WeightedEntry[] {
  const pool = entries.filter((entry) => entry.weight > 0);
  if (pool.length === 0) return [];

  const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
  const results: WeightedEntry[] = [];

  for (let i = 0; i < count; i++) {
    let roll = Math.random() * totalWeight;
    let picked = pool[pool.length - 1];
    for (const entry of pool) {
      roll -= entry.weight;
      if (roll <= 0) {
        picked = entry;
        break;
      }
    }
    results.push(picked);
  }

  return results;
}
