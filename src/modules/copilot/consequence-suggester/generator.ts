import { CONSEQUENCE_TEMPLATES, type ConsequenceTemplateCategory } from "@/modules/copilot/consequence-suggester/templates";

/**
 * Motor de geração combinatória do Consequence Suggester (Fase 8, ver
 * ARCHITECTURE.md, seção 19.4) — função pura, sem I/O (mesma filosofia de
 * `lore-guardian/heuristics.ts` e `roll-tables/roll.ts` da Fase 6): sorteia um
 * template e preenche seus placeholders com entidades reais da campanha
 * (`EntityPool`, montado por `queries.ts`) ou, quando faltar aquele tipo de
 * entidade, com um substituto genérico de `PLACEHOLDER_FALLBACKS`. `rng` é
 * injetável (default `Math.random`) só para permitir teste determinístico —
 * o app sempre chama sem esse argumento.
 */

export type PlaceholderKey = "NPC" | "FACCAO" | "LOCAL" | "ITEM";

export interface EntityPool {
  npcs: string[];
  factions: string[];
  locations: string[];
  items: string[];
}

export const EMPTY_ENTITY_POOL: EntityPool = { npcs: [], factions: [], locations: [], items: [] };

/**
 * Substitutos genéricos usados quando a campanha ainda não tem nenhuma
 * entidade daquele tipo. `FACCAO` é a exceção deliberada: como todo template
 * já escreve "a facção {{FACCAO}}" antes do placeholder (ver comentário em
 * `templates.ts`), o substituto aqui é só um nome (sem artigo) — igual ao que
 * um nome real de facção seria. Os demais (`NPC`/`LOCAL`/`ITEM`) são sempre
 * usados "nus" nos templates, então o substituto já vem com o artigo
 * embutido, funcionando como uma frase substantiva completa no lugar de um
 * nome próprio.
 */
const PLACEHOLDER_FALLBACKS: Record<PlaceholderKey, readonly string[]> = {
  NPC: [
    "um velho conhecido da região",
    "uma figura discreta cujo nome poucos sabem dizer",
    "um informante que só aparece quando convém",
    "uma antiga aliada de poucos favores",
    "um mercador itinerante de nome esquecido",
    "uma guarda aposentada da região",
    "um clérigo errante de fé incerta",
    "um caçador de recompensas silencioso",
  ],
  FACCAO: [
    "Guilda dos Corvos",
    "Cartel do Cais",
    "Irmandade Cinzenta",
    "Companhia do Falcão Negro",
    "Ordem Silenciosa",
    "Consórcio de Ferro",
    "Aliança dos Portões",
    "Culto da Maré Baixa",
  ],
  LOCAL: [
    "uma cidade vizinha",
    "uma vila fronteiriça pouco conhecida",
    "um posto avançado remoto",
    "um vilarejo à beira da estrada",
    "uma região isolada nos limites do mapa conhecido",
    "um assentamento recém-fundado",
    "uma cidade portuária movimentada",
    "um vale esquecido pelas rotas comerciais",
  ],
  ITEM: [
    "um artefato de valor incerto",
    "uma relíquia perdida havia gerações",
    "um item raro recém-descoberto",
    "um objeto de origem desconhecida",
    "uma peça de valor sentimental para alguém importante",
    "um talismã de procedência duvidosa",
    "um documento selado que ninguém ainda leu",
    "uma ferramenta antiga de propósito esquecido",
  ],
};

const PLACEHOLDER_PATTERN = /\{\{(NPC|FACCAO|LOCAL|ITEM)\}\}/g;

function poolFor(key: PlaceholderKey, pool: EntityPool): readonly string[] {
  switch (key) {
    case "NPC":
      return pool.npcs;
    case "FACCAO":
      return pool.factions;
    case "LOCAL":
      return pool.locations;
    case "ITEM":
      return pool.items;
  }
}

function pick<T>(values: readonly T[], rng: () => number): T {
  return values[Math.floor(rng() * values.length)];
}

/** Preenche os placeholders de um template — exportado à parte para ser testável isoladamente do sorteio de template. */
export function fillTemplate(template: string, pool: EntityPool, rng: () => number = Math.random): string {
  return template.replace(PLACEHOLDER_PATTERN, (_match, key: PlaceholderKey) => {
    const candidates = poolFor(key, pool);
    const source = candidates.length > 0 ? candidates : PLACEHOLDER_FALLBACKS[key];
    return pick(source, rng);
  });
}

export interface GeneratedConsequence {
  id: string;
  category: ConsequenceTemplateCategory;
  text: string;
}

/** Fisher-Yates com `rng` injetável — mesmo padrão de aleatoriedade pura do resto do projeto (`roll-tables/roll.ts`). */
function shuffledIndexes(length: number, rng: () => number): number[] {
  const indexes = Array.from({ length }, (_, i) => i);
  for (let i = indexes.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }
  return indexes;
}

/**
 * Gera `count` sugestões. Embaralha a ordem dos 120 templates antes de
 * sortear para maximizar variedade dentro de um mesmo lote (sem repetir
 * template enquanto houver um não usado ainda); só repete template se
 * `count` exceder o total de templates disponíveis — o que a UI nunca pede.
 */
export function generateConsequenceSuggestions(pool: EntityPool, count: number, rng: () => number = Math.random): GeneratedConsequence[] {
  const order = shuffledIndexes(CONSEQUENCE_TEMPLATES.length, rng);
  const results: GeneratedConsequence[] = [];

  for (let i = 0; i < count; i++) {
    const template = CONSEQUENCE_TEMPLATES[order[i % order.length]];
    results.push({
      id: `suggestion-${i}-${Math.floor(rng() * 1_000_000)}`,
      category: template.category,
      text: fillTemplate(template.text, pool, rng),
    });
  }

  return results;
}
