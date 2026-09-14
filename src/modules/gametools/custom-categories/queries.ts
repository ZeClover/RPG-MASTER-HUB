import "server-only";

import { db } from "@/lib/db";
import { requireCampaignAccess, visibilityWhereForRole } from "@/modules/core/permissions";

/**
 * PLAYER vê todas as categorias (a categoria em si não tem `visibility` —
 * quem carrega conteúdo GM-only são as entradas), mas só as entradas
 * `!= GM_ONLY` dentro delas. Uma categoria sem nenhuma entrada visível ainda
 * aparece (estado vazio da categoria), nunca some da lista — ver
 * ARCHITECTURE.md, seção 21.3.
 */
export async function listCategories(userId: string, campaignId: string) {
  const { role } = await requireCampaignAccess(userId, campaignId);

  return db.customCategory.findMany({
    where: { campaignId },
    orderBy: { createdAt: "asc" },
    include: {
      entries: { where: { visibility: visibilityWhereForRole(role) }, orderBy: { createdAt: "asc" } },
      _count: { select: { entries: true } },
    },
  });
}

export async function getCategoryForUser(userId: string, campaignId: string, categoryId: string) {
  const { role } = await requireCampaignAccess(userId, campaignId);

  return db.customCategory.findFirst({
    where: { id: categoryId, campaignId },
    include: {
      entries: { where: { visibility: visibilityWhereForRole(role) }, orderBy: { createdAt: "asc" } },
    },
  });
}

export function countCategories(campaignId: string) {
  return db.customCategory.count({ where: { campaignId } });
}
