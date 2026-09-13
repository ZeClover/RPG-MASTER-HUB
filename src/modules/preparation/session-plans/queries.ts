import "server-only";

import { db } from "@/lib/db";
import { requireCampaignAccess } from "@/modules/core/permissions";
import type { WikiListFilters } from "@/modules/creation/wiki-filters";
import type { SessionPlanStatus } from "@/generated/prisma/client";

export function listSessionPlans(campaignId: string, filters: WikiListFilters<SessionPlanStatus>) {
  return db.sessionPlan.findMany({
    where: {
      campaignId,
      archived: filters.archived ?? false,
      favorite: filters.favorite ? true : undefined,
      status: filters.status,
      title: filters.q ? { contains: filters.q, mode: "insensitive" } : undefined,
    },
    orderBy: [{ sessionNumber: "desc" }, { updatedAt: "desc" }],
    include: { _count: { select: { scenes: true, checklist: true } } },
  });
}

// Fase 9 (permissões avançadas, ver ARCHITECTURE.md, seção 21.5): SessionPlan
// é material de preparação do mestre (tem `gmNotes`, sem `visibility` — seção
// 13.5) — nunca foi pensado como conteúdo legível por PLAYER, então a leitura
// exige CO_GM como qualquer mutação, ao contrário do padrão `PLAYER` default
// das entidades de wiki.
export async function getSessionPlanForUser(userId: string, campaignId: string, sessionPlanId: string) {
  await requireCampaignAccess(userId, campaignId, "CO_GM");
  return db.sessionPlan.findFirst({
    where: { id: sessionPlanId, campaignId },
    include: {
      scenes: { orderBy: { order: "asc" } },
      checklist: { orderBy: { order: "asc" } },
    },
  });
}

export function countSessionPlans(campaignId: string) {
  return db.sessionPlan.count({ where: { campaignId, archived: false } });
}
