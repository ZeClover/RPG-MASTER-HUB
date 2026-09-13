import "server-only";

import { db } from "@/lib/db";
import type { CampaignRole, MysteryStatus, RelatableEntityType } from "@/generated/prisma/client";
import { entityForRole, isPlayerRole, requireCampaignAccess, visibilityWhereForRole } from "@/modules/core/permissions";
import type { WikiListFilters } from "@/modules/creation/wiki-filters";
import { resolveEntityRefs, type EntityRef } from "@/modules/creation/relationships/queries";

export function listMysteries(campaignId: string, filters: WikiListFilters<MysteryStatus>, role: CampaignRole) {
  return db.mystery.findMany({
    where: {
      campaignId,
      archived: filters.archived ?? false,
      favorite: filters.favorite ? true : undefined,
      status: filters.status,
      visibility: visibilityWhereForRole(role),
      title: filters.q ? { contains: filters.q, mode: "insensitive" } : undefined,
      tags: filters.tag ? { some: { tag: { slug: filters.tag } } } : undefined,
    },
    orderBy: { updatedAt: "desc" },
    include: { tags: { include: { tag: true } } },
  });
}

/**
 * Player Knowledge (Fase 9, ver ARCHITECTURE.md, seção 21.3): `discovered` é
 * controle interno do mestre ("já rolei isso na mesa"); `sharedWithPlayers` é
 * o que de fato foi entregue aos jogadores. Um PLAYER só vê pistas com
 * `sharedWithPlayers: true` — mesmo que já `discovered`, uma pista descoberta
 * mas ainda não comunicada aos jogadores continua invisível para eles.
 */
export async function getMysteryForUser(userId: string, campaignId: string, mysteryId: string) {
  const { role } = await requireCampaignAccess(userId, campaignId);
  const mystery = await db.mystery.findFirst({
    where: { id: mysteryId, campaignId },
    include: {
      tags: { include: { tag: true } },
      clues: { orderBy: { order: "asc" } },
    },
  });
  const visible = entityForRole(mystery, role);
  if (!visible) return visible;
  if (!isPlayerRole(role)) return visible;
  return { ...visible, clues: visible.clues.filter((clue) => clue.sharedWithPlayers) };
}

export function countMysteries(campaignId: string) {
  return db.mystery.count({ where: { campaignId, archived: false } });
}

/**
 * Resolve, em lote por tipo, a que entidade cada pista vinculada aponta —
 * reaproveita `resolveEntityRefs` do sistema de Relacionamentos (ver
 * ARCHITECTURE.md, seção 16.4) em vez de uma linha em `Relationship`, já que
 * o vínculo de uma pista é um ponteiro simples, não uma relação bidirecional.
 */
export async function resolveClueLinks(
  campaignId: string,
  clues: { linkedEntityType: EntityRef["type"] | null; linkedEntityId: string | null }[],
): Promise<Map<string, EntityRef>> {
  const idsByType = new Map<EntityRef["type"], Set<string>>();
  for (const clue of clues) {
    if (!clue.linkedEntityType || !clue.linkedEntityId) continue;
    if (!idsByType.has(clue.linkedEntityType)) idsByType.set(clue.linkedEntityType, new Set());
    idsByType.get(clue.linkedEntityType)!.add(clue.linkedEntityId);
  }

  const combined = new Map<string, EntityRef>();
  for (const [type, ids] of idsByType) {
    const resolved = await resolveEntityRefs(campaignId, type, [...ids]);
    for (const [id, ref] of resolved) combined.set(`${type}:${id}`, ref);
  }
  return combined;
}

/**
 * Fase 7 (Context Engine, ver ARCHITECTURE.md, seção 18.2) — o inverso de
 * `resolveClueLinks`: dado uma entidade, quais pistas de Mistério apontam
 * PARA ela. Hoje isso não aparece em lugar nenhum da própria página da
 * entidade (só o Mistério, ao abrir, mostra o vínculo saindo dele) — é
 * exatamente o tipo de referência cruzada que motiva o Context Engine.
 */
export function findCluesLinkedToEntity(campaignId: string, type: RelatableEntityType, id: string) {
  return db.clue.findMany({
    where: { linkedEntityType: type, linkedEntityId: id, mystery: { campaignId } },
    include: { mystery: { select: { id: true, title: true, archived: true } } },
    orderBy: { createdAt: "desc" },
  });
}
