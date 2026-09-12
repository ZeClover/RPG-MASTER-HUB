"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess } from "@/modules/core/permissions";
import { rollCountSchema } from "@/modules/gametools/roll-tables/schemas";
import { rollWeightedEntries } from "@/modules/gametools/roll-tables/roll";

export interface RollTableRollResult {
  results: { id: string; label: string }[];
  error?: string;
}

/**
 * Rolar é leitura (não muda nada no banco), então basta o papel mínimo
 * padrão (`PLAYER`) — mesmo critério de qualquer página de detalhe da wiki.
 * Busca as entradas direto do banco a cada rolagem (não confia num estado
 * já carregado no cliente) para nunca sortear com pesos desatualizados.
 */
export async function rollRollTableAction(campaignId: string, tableId: string, count: number): Promise<RollTableRollResult> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId);

  const parsedCount = rollCountSchema.safeParse(count);
  if (!parsedCount.success) {
    return { results: [], error: "Quantidade inválida." };
  }

  const table = await db.rollTable.findFirst({
    where: { id: tableId, campaignId },
    include: { entries: true },
  });
  if (!table) {
    return { results: [], error: "Tabela não encontrada." };
  }
  if (table.entries.length === 0) {
    return { results: [], error: "Esta tabela ainda não tem entradas." };
  }

  const drawn = rollWeightedEntries(table.entries, parsedCount.data);
  return { results: drawn.map((entry) => ({ id: entry.id, label: entry.label })) };
}
