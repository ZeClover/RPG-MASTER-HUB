// Player View (Fase 9) — helpers puros reaproveitáveis por toda query de
// leitura de conteúdo com `visibility`, para nunca duplicar a regra "PLAYER
// não vê GM_ONLY" espalhada pelos 12 módulos que têm esse campo (NPC, Local,
// Facção, Lore, Missão, Trama, Consequência, Evento de Timeline, Mistério,
// Monstro, Item, Poder — os mesmos 12 de `RelatableEntityType`). Ver
// ARCHITECTURE.md, seção 21, para a decisão completa.
//
// Sem "server-only": são funções puras sobre dados já carregados (mesmo
// espírito de `heuristics.ts`/`roll.ts`), não fazem I/O — só decidem o que já
// foi buscado do banco pode ser mostrado a este papel.
import type { CampaignRole, Visibility } from "@/generated/prisma/client";

export function isPlayerRole(role: CampaignRole): boolean {
  return role === "PLAYER";
}

/** CO_GM/OWNER veem tudo; PLAYER só vê o que não é GM_ONLY. */
export function canRoleSeeVisibility(role: CampaignRole, visibility: Visibility): boolean {
  return !isPlayerRole(role) || visibility !== "GM_ONLY";
}

/**
 * Gate de leitura de uma única entidade: retorna `null` (equivalente a "não
 * encontrado" para quem não pode ver) quando o papel não pode enxergar a
 * visibilidade da entidade. Toda `get<Entidade>ForUser` deve passar o
 * resultado do banco por aqui antes de devolver — o mesmo `null` que já
 * disparava `notFound()` para "não existe" agora também cobre "existe, mas
 * não é para você ver", sem exigir nenhuma mudança nas páginas que já fazem
 * `if (!entidade) notFound()`.
 */
export function entityForRole<T extends { visibility: Visibility }>(entity: T | null, role: CampaignRole): T | null {
  if (!entity) return null;
  return canRoleSeeVisibility(role, entity.visibility) ? entity : null;
}

/** Filtra uma lista já carregada, removendo GM_ONLY para PLAYER (defesa em profundidade — o filtro "de verdade" já deve estar no `where` do Prisma). */
export function filterVisibleForRole<T extends { visibility: Visibility }>(items: T[], role: CampaignRole): T[] {
  if (!isPlayerRole(role)) return items;
  return items.filter((item) => canRoleSeeVisibility(role, item.visibility));
}

/**
 * Condição pronta para o `where` de uma listagem Prisma: `undefined` para
 * CO_GM/OWNER (sem filtro extra) ou `{ not: "GM_ONLY" }` para PLAYER. Usada
 * em todo `list<Entidade>s` para que a página nem processe/pagine itens que o
 * papel não pode ver, em vez de buscar tudo e filtrar em memória depois.
 */
export function visibilityWhereForRole(role: CampaignRole): { not: Visibility } | undefined {
  return isPlayerRole(role) ? { not: "GM_ONLY" } : undefined;
}

/**
 * Remove campos "só do mestre" (ex.: `secrets`/`gmNotes` em NPCs, `secrets`
 * em Facções — ver ARCHITECTURE.md, seção 21.2, para o levantamento completo
 * por entidade) quando o papel é PLAYER. CO_GM/OWNER recebem a entidade
 * intacta. Os campos viram `null` (não são omitidos) para o tipo de retorno
 * continuar batendo com o shape normal da entidade.
 */
export function stripGmFields<T extends object, K extends keyof T>(
  entity: T | null,
  role: CampaignRole,
  fields: K[],
): T | null {
  if (!entity || !isPlayerRole(role)) return entity;
  const clone = { ...entity };
  for (const field of fields) {
    clone[field] = null as T[K];
  }
  return clone;
}
