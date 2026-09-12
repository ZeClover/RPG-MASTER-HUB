import "server-only";

import { db } from "@/lib/db";
import { requireCampaignAccess } from "@/modules/core/permissions";
import type { WikiListFilters } from "@/modules/creation/wiki-filters";

export function listLocations(campaignId: string, filters: WikiListFilters) {
  return db.location.findMany({
    where: {
      campaignId,
      archived: filters.archived ?? false,
      favorite: filters.favorite ? true : undefined,
      canonStatus: filters.status,
      name: filters.q ? { contains: filters.q, mode: "insensitive" } : undefined,
      tags: filters.tag ? { some: { tag: { slug: filters.tag } } } : undefined,
    },
    orderBy: { updatedAt: "desc" },
    include: { tags: { include: { tag: true } }, parent: { select: { name: true } } },
  });
}

export async function getLocationForUser(userId: string, campaignId: string, locationId: string) {
  await requireCampaignAccess(userId, campaignId);
  return db.location.findFirst({
    where: { id: locationId, campaignId },
    include: { tags: { include: { tag: true } }, parent: { select: { id: true, name: true } } },
  });
}

export function listLocationChildren(campaignId: string, locationId: string) {
  return db.location.findMany({
    where: { campaignId, parentLocationId: locationId },
    orderBy: { name: "asc" },
  });
}

export function countLocations(campaignId: string) {
  return db.location.count({ where: { campaignId, archived: false } });
}

/** Sobe a árvore a partir do local até a raiz — o último item é o próprio local. */
export async function getLocationBreadcrumb(locationId: string): Promise<{ id: string; name: string }[]> {
  const chain: { id: string; name: string }[] = [];
  let currentId: string | null = locationId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const location: { id: string; name: string; parentLocationId: string | null } | null = await db.location.findUnique({
      where: { id: currentId },
      select: { id: true, name: true, parentLocationId: true },
    });
    if (!location) break;

    chain.unshift({ id: location.id, name: location.name });
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
