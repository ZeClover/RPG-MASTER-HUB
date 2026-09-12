import "server-only";

import { db } from "@/lib/db";
import type { RelatableEntityType, RelationshipImportance, Visibility } from "@/generated/prisma/client";

export interface EntityRef {
  type: RelatableEntityType;
  id: string;
  name: string;
  imageUrl: string | null;
  archived: boolean;
}

/** Único ponto que sabe consultar cada tabela concreta por trás do tipo polimórfico. */
export async function searchEntitiesByType(
  campaignId: string,
  type: RelatableEntityType,
  query: string,
  excludeIds: string[] = [],
): Promise<{ id: string; name: string; imageUrl: string | null; archived: boolean }[]> {
  const idFilter = excludeIds.length ? { notIn: excludeIds } : undefined;

  switch (type) {
    case "NPC": {
      return db.npc.findMany({
        where: { campaignId, id: idFilter, name: query ? { contains: query, mode: "insensitive" } : undefined },
        take: 20,
        orderBy: { name: "asc" },
        select: { id: true, name: true, imageUrl: true, archived: true },
      });
    }
    case "LOCATION": {
      return db.location.findMany({
        where: { campaignId, id: idFilter, name: query ? { contains: query, mode: "insensitive" } : undefined },
        take: 20,
        orderBy: { name: "asc" },
        select: { id: true, name: true, imageUrl: true, archived: true },
      });
    }
    case "FACTION": {
      return db.faction.findMany({
        where: { campaignId, id: idFilter, name: query ? { contains: query, mode: "insensitive" } : undefined },
        take: 20,
        orderBy: { name: "asc" },
        select: { id: true, name: true, imageUrl: true, archived: true },
      });
    }
    case "LORE_PAGE": {
      const rows = await db.lorePage.findMany({
        where: { campaignId, id: idFilter, title: query ? { contains: query, mode: "insensitive" } : undefined },
        take: 20,
        orderBy: { title: "asc" },
        select: { id: true, title: true, imageUrl: true, archived: true },
      });
      return rows.map((row) => ({ id: row.id, name: row.title, imageUrl: row.imageUrl, archived: row.archived }));
    }
    case "QUEST": {
      const rows = await db.quest.findMany({
        where: { campaignId, id: idFilter, title: query ? { contains: query, mode: "insensitive" } : undefined },
        take: 20,
        orderBy: { title: "asc" },
        select: { id: true, title: true, archived: true },
      });
      return rows.map((row) => ({ id: row.id, name: row.title, imageUrl: null, archived: row.archived }));
    }
    case "PLOT_THREAD": {
      const rows = await db.plotThread.findMany({
        where: { campaignId, id: idFilter, title: query ? { contains: query, mode: "insensitive" } : undefined },
        take: 20,
        orderBy: { title: "asc" },
        select: { id: true, title: true, archived: true },
      });
      return rows.map((row) => ({ id: row.id, name: row.title, imageUrl: null, archived: row.archived }));
    }
    case "CONSEQUENCE": {
      const rows = await db.consequence.findMany({
        where: { campaignId, id: idFilter, title: query ? { contains: query, mode: "insensitive" } : undefined },
        take: 20,
        orderBy: { title: "asc" },
        select: { id: true, title: true, archived: true },
      });
      return rows.map((row) => ({ id: row.id, name: row.title, imageUrl: null, archived: row.archived }));
    }
    case "TIMELINE_EVENT": {
      const rows = await db.timelineEvent.findMany({
        where: { campaignId, id: idFilter, title: query ? { contains: query, mode: "insensitive" } : undefined },
        take: 20,
        orderBy: { title: "asc" },
        select: { id: true, title: true, archived: true },
      });
      return rows.map((row) => ({ id: row.id, name: row.title, imageUrl: null, archived: row.archived }));
    }
    case "MYSTERY": {
      const rows = await db.mystery.findMany({
        where: { campaignId, id: idFilter, title: query ? { contains: query, mode: "insensitive" } : undefined },
        take: 20,
        orderBy: { title: "asc" },
        select: { id: true, title: true, archived: true },
      });
      return rows.map((row) => ({ id: row.id, name: row.title, imageUrl: null, archived: row.archived }));
    }
  }
}

export async function resolveEntityRefs(
  campaignId: string,
  type: RelatableEntityType,
  ids: string[],
): Promise<Map<string, EntityRef>> {
  const map = new Map<string, EntityRef>();
  if (ids.length === 0) return map;

  if (type === "NPC") {
    const rows = await db.npc.findMany({
      where: { campaignId, id: { in: ids } },
      select: { id: true, name: true, imageUrl: true, archived: true },
    });
    for (const row of rows) map.set(row.id, { type, ...row });
  } else if (type === "LOCATION") {
    const rows = await db.location.findMany({
      where: { campaignId, id: { in: ids } },
      select: { id: true, name: true, imageUrl: true, archived: true },
    });
    for (const row of rows) map.set(row.id, { type, ...row });
  } else if (type === "FACTION") {
    const rows = await db.faction.findMany({
      where: { campaignId, id: { in: ids } },
      select: { id: true, name: true, imageUrl: true, archived: true },
    });
    for (const row of rows) map.set(row.id, { type, ...row });
  } else if (type === "LORE_PAGE") {
    const rows = await db.lorePage.findMany({
      where: { campaignId, id: { in: ids } },
      select: { id: true, title: true, imageUrl: true, archived: true },
    });
    for (const row of rows) map.set(row.id, { type, id: row.id, name: row.title, imageUrl: row.imageUrl, archived: row.archived });
  } else if (type === "QUEST") {
    const rows = await db.quest.findMany({
      where: { campaignId, id: { in: ids } },
      select: { id: true, title: true, archived: true },
    });
    for (const row of rows) map.set(row.id, { type, id: row.id, name: row.title, imageUrl: null, archived: row.archived });
  } else if (type === "PLOT_THREAD") {
    const rows = await db.plotThread.findMany({
      where: { campaignId, id: { in: ids } },
      select: { id: true, title: true, archived: true },
    });
    for (const row of rows) map.set(row.id, { type, id: row.id, name: row.title, imageUrl: null, archived: row.archived });
  } else if (type === "CONSEQUENCE") {
    const rows = await db.consequence.findMany({
      where: { campaignId, id: { in: ids } },
      select: { id: true, title: true, archived: true },
    });
    for (const row of rows) map.set(row.id, { type, id: row.id, name: row.title, imageUrl: null, archived: row.archived });
  } else if (type === "TIMELINE_EVENT") {
    const rows = await db.timelineEvent.findMany({
      where: { campaignId, id: { in: ids } },
      select: { id: true, title: true, archived: true },
    });
    for (const row of rows) map.set(row.id, { type, id: row.id, name: row.title, imageUrl: null, archived: row.archived });
  } else if (type === "MYSTERY") {
    const rows = await db.mystery.findMany({
      where: { campaignId, id: { in: ids } },
      select: { id: true, title: true, archived: true },
    });
    for (const row of rows) map.set(row.id, { type, id: row.id, name: row.title, imageUrl: null, archived: row.archived });
  }

  return map;
}

export function relationshipsInvolvingEntity(type: RelatableEntityType, id: string) {
  return {
    OR: [
      { sourceType: type, sourceId: id },
      { targetType: type, targetId: id },
    ],
  };
}

export function countRelationshipsForEntity(campaignId: string, type: RelatableEntityType, id: string) {
  return db.relationship.count({ where: { campaignId, ...relationshipsInvolvingEntity(type, id) } });
}

export interface ResolvedRelationship {
  id: string;
  type: string;
  description: string | null;
  importance: RelationshipImportance | null;
  visibility: Visibility;
  direction: "outgoing" | "incoming";
  other: EntityRef;
}

/**
 * Busca todos os relacionamentos (indo e vindo) de uma entidade e resolve o
 * "outro lado" contra a tabela concreta certa, em lote por tipo — evita N+1
 * mesmo sem poder usar `include` polimórfico (ver ARCHITECTURE.md).
 */
export async function listRelationshipsForEntity(
  campaignId: string,
  type: RelatableEntityType,
  id: string,
): Promise<ResolvedRelationship[]> {
  const rows = await db.relationship.findMany({
    where: { campaignId, ...relationshipsInvolvingEntity(type, id) },
    orderBy: { createdAt: "desc" },
  });

  const idsByType = new Map<RelatableEntityType, Set<string>>();
  for (const row of rows) {
    const isOutgoing = row.sourceType === type && row.sourceId === id;
    const otherType = isOutgoing ? row.targetType : row.sourceType;
    const otherId = isOutgoing ? row.targetId : row.sourceId;
    if (!idsByType.has(otherType)) idsByType.set(otherType, new Set());
    idsByType.get(otherType)!.add(otherId);
  }

  const resolvedByType = new Map<RelatableEntityType, Map<string, EntityRef>>();
  for (const [otherType, ids] of idsByType) {
    resolvedByType.set(otherType, await resolveEntityRefs(campaignId, otherType, [...ids]));
  }

  const results: ResolvedRelationship[] = [];
  for (const row of rows) {
    const isOutgoing = row.sourceType === type && row.sourceId === id;
    const otherType = isOutgoing ? row.targetType : row.sourceType;
    const otherId = isOutgoing ? row.targetId : row.sourceId;
    const other = resolvedByType.get(otherType)?.get(otherId);
    if (!other) continue; // referência órfã defensiva — não deveria acontecer

    results.push({
      id: row.id,
      type: row.type,
      description: row.description,
      importance: row.importance,
      visibility: row.visibility,
      direction: isOutgoing ? "outgoing" : "incoming",
      other,
    });
  }

  return results;
}
