import type { CanonStatus } from "@/generated/prisma/client";

/** Filtros compartilhados pelas listas de NPCs, Locais, Facções e Lore. */
export interface WikiListFilters {
  q?: string;
  tag?: string;
  status?: CanonStatus;
  favorite?: boolean;
  archived?: boolean;
}
