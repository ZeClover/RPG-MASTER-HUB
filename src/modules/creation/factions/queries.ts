import "server-only";

import { db } from "@/lib/db";
import type { CampaignRole } from "@/generated/prisma/client";
import { entityForRole, requireCampaignAccess, stripGmFields, visibilityWhereForRole } from "@/modules/core/permissions";
import type { WikiListFilters } from "@/modules/creation/wiki-filters";

// Campo "só do mestre" da Facção (Player View, ver ARCHITECTURE.md, seção
// 21.2) — `notes` fica de fora de propósito: é um campo de anotação genérica,
// sem o mesmo peso narrativo de "segredo", então continua visível a PLAYER
// quando a Facção como um todo não é GM_ONLY.
const FACTION_GM_ONLY_FIELDS = ["secrets"] as const;

export function listFactions(campaignId: string, filters: WikiListFilters, role: CampaignRole) {
  return db.faction.findMany({
    where: {
      campaignId,
      archived: filters.archived ?? false,
      favorite: filters.favorite ? true : undefined,
      canonStatus: filters.status,
      visibility: visibilityWhereForRole(role),
      name: filters.q ? { contains: filters.q, mode: "insensitive" } : undefined,
      tags: filters.tag ? { some: { tag: { slug: filters.tag } } } : undefined,
    },
    orderBy: { updatedAt: "desc" },
    include: { tags: { include: { tag: true } } },
  });
}

export async function getFactionForUser(userId: string, campaignId: string, factionId: string) {
  const { role } = await requireCampaignAccess(userId, campaignId);
  const faction = await db.faction.findFirst({
    where: { id: factionId, campaignId },
    include: { tags: { include: { tag: true } } },
  });
  return stripGmFields(entityForRole(faction, role), role, [...FACTION_GM_ONLY_FIELDS]);
}

export function countFactions(campaignId: string) {
  return db.faction.count({ where: { campaignId, archived: false } });
}
