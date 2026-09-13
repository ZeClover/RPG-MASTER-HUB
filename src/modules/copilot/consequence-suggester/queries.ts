import "server-only";

import { db } from "@/lib/db";
import type { EntityPool } from "@/modules/copilot/consequence-suggester/generator";

/**
 * Carrega os nomes reais da campanha usados para preencher os placeholders
 * do Consequence Suggester (Fase 8, seção 19.4) — só nome e só não-arquivado
 * (o mesmo motivo de `loadAllEntityNames` do Lore Guardian: sugerir uma
 * consequência sobre um NPC arquivado confundiria mais do que ajudaria).
 * Carregado uma vez por visita à página e reaproveitado no cliente a cada
 * "Sugerir novamente" — não há necessidade de rebuscar o pool a cada clique,
 * já que a lista de entidades da campanha muda com pouca frequência dentro
 * de uma mesma sessão de uso.
 */
export async function loadEntityPool(campaignId: string): Promise<EntityPool> {
  const where = { campaignId, archived: false };

  const [npcs, factions, locations, items] = await Promise.all([
    db.npc.findMany({ where, select: { name: true } }),
    db.faction.findMany({ where, select: { name: true } }),
    db.location.findMany({ where, select: { name: true } }),
    db.item.findMany({ where, select: { name: true } }),
  ]);

  return {
    npcs: npcs.map((row) => row.name),
    factions: factions.map((row) => row.name),
    locations: locations.map((row) => row.name),
    items: items.map((row) => row.name),
  };
}
