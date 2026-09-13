import "server-only";

import { db } from "@/lib/db";
import type { CampaignRole, Visibility } from "@/generated/prisma/client";
import {
  canRoleSeeVisibility,
  entityForRole,
  requireCampaignAccess,
  visibilityWhereForRole,
} from "@/modules/core/permissions";
import type { WikiListFilters } from "@/modules/creation/wiki-filters";

export function listLocations(campaignId: string, filters: WikiListFilters, role: CampaignRole) {
  return db.location.findMany({
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
    include: { tags: { include: { tag: true } }, parent: { select: { name: true } } },
  });
}

export async function getLocationForUser(userId: string, campaignId: string, locationId: string) {
  const { role } = await requireCampaignAccess(userId, campaignId);
  const location = await db.location.findFirst({
    where: { id: locationId, campaignId },
    include: { tags: { include: { tag: true } }, parent: { select: { id: true, name: true } } },
  });
  return entityForRole(location, role);
}

export function listLocationChildren(campaignId: string, locationId: string, role: CampaignRole) {
  return db.location.findMany({
    where: { campaignId, parentLocationId: locationId, visibility: visibilityWhereForRole(role) },
    orderBy: { name: "asc" },
  });
}

export function countLocations(campaignId: string) {
  return db.location.count({ where: { campaignId, archived: false } });
}

/**
 * Sobe a árvore a partir do local até a raiz — o último item é o próprio
 * local. `role` (Player View, Fase 9) omite da lista qualquer ancestral
 * GM_ONLY que um PLAYER não deveria ver — a subida continua normalmente
 * (a estrutura da árvore em si não é segredo, só o nome/existência do local
 * oculto), só o nome dele não aparece no caminho.
 */
export async function getLocationBreadcrumb(
  locationId: string,
  role: CampaignRole,
): Promise<{ id: string; name: string }[]> {
  const chain: { id: string; name: string }[] = [];
  let currentId: string | null = locationId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const location: { id: string; name: string; parentLocationId: string | null; visibility: Visibility } | null =
      await db.location.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, parentLocationId: true, visibility: true },
      });
    if (!location) break;

    if (canRoleSeeVisibility(role, location.visibility)) {
      chain.unshift({ id: location.id, name: location.name });
    }
    currentId = location.parentLocationId;
  }

  return chain;
}

/** Todos os descendentes de um local (para excluir do seletor de pai e evitar ciclos). */
export async function getLocationDescendantIds(locationId: string): Promise<Set<string>> {
  const result = new Set<string>();
  let frontier = [locationId];

  while (frontier.length > 0) {
    const children = await db.location.findMany({
      where: { parentLocationId: { in: frontier } },
      select: { id: true },
    });
    frontier = children.map((child) => child.id);
    for (const id of frontier) result.add(id);
  }

  return result;
}

export async function searchLocations(campaignId: string, query: string, currentLocationId?: string) {
  let excludeIds: string[] = [];
  if (currentLocationId) {
    const descendants = await getLocationDescendantIds(currentLocationId);
    excludeIds = [currentLocationId, ...descendants];
  }

  return db.location.findMany({
    where: {
      campaignId,
      id: excludeIds.length ? { notIn: excludeIds } : undefined,
      name: query ? { contains: query, mode: "insensitive" } : undefined,
    },
    take: 20,
    orderBy: { name: "asc" },
    select: { id: true, name: true, imageUrl: true, archived: true },
  });
}
