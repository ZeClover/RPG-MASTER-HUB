import type { CanonStatus } from "@/generated/prisma/client";

/**
 * Filtros compartilhados por toda lista com busca/tag/status/favorito/arquivado.
 * `TStatus` é genérico porque cada domínio tem seu próprio enum de status
 * (CanonStatus para NPCs/Locais/Facções/Lore, QuestStatus para Missões, etc.) —
 * o padrão de filtro (URL como fonte de verdade) é o mesmo, o enum não.
 */
export interface WikiListFilters<TStatus = CanonStatus> {
  q?: string;
  tag?: string;
  status?: TStatus;
  favorite?: boolean;
  archived?: boolean;
}
