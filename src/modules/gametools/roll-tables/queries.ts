import "server-only";

import { db } from "@/lib/db";
import type { RollTableKind } from "@/generated/prisma/client";
import { requireCampaignAccess } from "@/modules/core/permissions";

export function listRollTables(campaignId: string, kind: RollTableKind, options: { archived?: boolean } = {}) {
  return db.rollTable.findMany({
    where: { campaignId, kind, archived: options.archived ?? false },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { entries: true } } },
  });
}

// Fase 9 (permissões avançadas, ver ARCHITECTURE.md, seção 21.5): RollTable é
// ferramenta de mesa do mestre, sem `visibility` (seção 17.3) — leitura exige
// CO_GM, mesmo padrão de SessionPlan.
export async function getRollTableForUser(
  userId: string,
  campaignId: string,
  kind: RollTableKind,
  tableId: string,
) {
  await requireCampaignAccess(userId, campaignId, "CO_GM");
  return db.rollTable.findFirst({
    where: { id: tableId, campaignId, kind },
    include: { entries: { orderBy: { order: "asc" } } },
  });
}

export function countRollTables(campaignId: string, kind: RollTableKind) {
  return db.rollTable.count({ where: { campaignId, kind, archived: false } });
}
