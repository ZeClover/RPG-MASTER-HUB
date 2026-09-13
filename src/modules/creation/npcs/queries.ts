import "server-only";

import { db } from "@/lib/db";
import type { CampaignRole } from "@/generated/prisma/client";
import { entityForRole, requireCampaignAccess, stripGmFields, visibilityWhereForRole } from "@/modules/core/permissions";
import type { WikiListFilters } from "@/modules/creation/wiki-filters";

// Campos "só do mestre" do NPC (Player View, ver ARCHITECTURE.md, seção 21.2):
// além do gate por `visibility`, estes dois nunca chegam a um PLAYER mesmo
// quando o NPC como um todo é PLAYERS/PUBLIC.
const NPC_GM_ONLY_FIELDS = ["secrets", "gmNotes"] as const;

export function listNpcs(campaignId: string, filters: WikiListFilters, role: CampaignRole) {
  return db.npc.findMany({
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

export async function getNpcForUser(userId: string, campaignId: string, npcId: string) {
  const { role } = await requireCampaignAccess(userId, campaignId);
  const npc = await db.npc.findFirst({
    where: { id: npcId, campaignId },
    include: { tags: { include: { tag: true } } },
  });
  return stripGmFields(entityForRole(npc, role), role, [...NPC_GM_ONLY_FIELDS]);
}

export function countNpcs(campaignId: string) {
  return db.npc.count({ where: { campaignId, archived: false } });
}
