import "server-only";

import { db } from "@/lib/db";
import type { CampaignRole, RelatableEntityType, RelationshipImportance, Visibility } from "@/generated/prisma/client";
import { canRoleSeeVisibility, isPlayerRole } from "@/modules/core/permissions";

export interface EntityRef {
  type: RelatableEntityType;
  id: string;
  name: string;
  imageUrl: string | null;
  archived: boolean;
  visibility: Visibility;
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
    case "MONSTER": {
      return db.monster.findMany({
        where: { campaignId, id: idFilter, name: query ? { contains: query, mode: "insensitive" } : undefined },
        take: 20,
        orderBy: { name: "asc" },
        select: { id: true, name: true, imageUrl: true, archived: true },
      });
    }
    case "ITEM": {
      return db.item.findMany({
        where: { campaignId, id: idFilter, name: query ? { contains: query, mode: "insensitive" } : undefined },
        take: 20,
        orderBy: { name: "asc" },
        select: { id: true, name: true, imageUrl: true, archived: true },
      });
    }
    case "POWER": {
      const rows = await db.power.findMany({
        where: { campaignId, id: idFilter, name: query ? { contains: query, mode: "insensitive" } : undefined },
        take: 20,
        orderBy: { name: "asc" },
        select: { id: true, name: true, archived: true },
      });
      return rows.map((row) => ({ id: row.id, name: row.name, imageUrl: null, archived: row.archived }));
    }
  }
}

/**
 * Resolve, em lote por tipo, os IDs referenciados por um `Relationship`
 * contra a tabela concreta certa. Desde a Fase 9, todo `select` também traz
 * `visibility` — não para escondar nada aqui (esta função não sabe o papel de
 * quem pediu), mas porque `listRelationshipsForEntity` (abaixo) precisa dela
 * para decidir se mostra a relação a um PLAYER quando o "outro lado" é
 * GM_ONLY (ver ARCHITECTURE.md, seção 21.2).
 */
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
      select: { id: true, name: true, imageUrl: true, archived: true, visibility: true },
    });
    for (const row of rows) map.set(row.id, { type, ...row });
  } else if (type === "LOCATION") {
    const rows = await db.location.findMany({
      where: { campaignId, id: { in: ids } },
      select: { id: true, name: true, imageUrl: true, archived: true, visibility: true },
    });
    for (const row of rows) map.set(row.id, { type, ...row });
  } else if (type === "FACTION") {
    const rows = await db.faction.findMany({
      where: { campaignId, id: { in: ids } },
      select: { id: true, name: true, imageUrl: true, archived: true, visibility: true },
    });
    for (const row of rows) map.set(row.id, { type, ...row });
  } else if (type === "LORE_PAGE") {
    const rows = await db.lorePage.findMany({
      where: { campaignId, id: { in: ids } },
      select: { id: true, title: true, imageUrl: true, archived: true, visibility: true },
    });
    for (const row of rows)
      map.set(row.id, {
        type,
        id: row.id,
        name: row.title,
        imageUrl: row.imageUrl,
        archived: row.archived,
        visibility: row.visibility,
      });
  } else if (type === "QUEST") {
    const rows = await db.quest.findMany({
      where: { campaignId, id: { in: ids } },
      select: { id: true, title: true, archived: true, visibility: true },
    });
    for (const row of rows)
      map.set(row.id, {
        type,
        id: row.id,
        name: row.title,
        imageUrl: null,
        archived: row.archived,
        visibility: row.visibility,
      });
  } else if (type === "PLOT_THREAD") {
    const rows = await db.plotThread.findMany({
      where: { campaignId, id: { in: ids } },
      select: { id: true, title: true, archived: true, visibility: true },
    });
    for (const row of rows)
      map.set(row.id, {
        type,
        id: row.id,
        name: row.title,
        imageUrl: null,
        archived: row.archived,
        visibility: row.visibility,
      });
  } else if (type === "CONSEQUENCE") {
    const rows = await db.consequence.findMany({
      where: { campaignId, id: { in: ids } },
      select: { id: true, title: true, archived: true, visibility: true },
    });
    for (const row of rows)
      map.set(row.id, {
        type,
        id: row.id,
        name: row.title,
        imageUrl: null,
        archived: row.archived,
        visibility: row.visibility,
      });
  } else if (type === "TIMELINE_EVENT") {
    const rows = await db.timelineEvent.findMany({
      where: { campaignId, id: { in: ids } },
      select: { id: true, title: true, archived: true, visibility: true },
    });
    for (const row of rows)
      map.set(row.id, {
        type,
        id: row.id,
        name: row.title,
        imageUrl: null,
        archived: row.archived,
        visibility: row.visibility,
      });
  } else if (type === "MYSTERY") {
    const rows = await db.mystery.findMany({
      where: { campaignId, id: { in: ids } },
      select: { id: true, title: true, archived: true, visibility: true },
    });
    for (const row of rows)
      map.set(row.id, {
        type,
        id: row.id,
        name: row.title,
        imageUrl: null,
        archived: row.archived,
        visibility: row.visibility,
      });
  } else if (type === "MONSTER") {
    const rows = await db.monster.findMany({
      where: { campaignId, id: { in: ids } },
      select: { id: true, name: true, imageUrl: true, archived: true, visibility: true },
    });
    for (const row of rows) map.set(row.id, { type, ...row });
  } else if (type === "ITEM") {
    const rows = await db.item.findMany({
      where: { campaignId, id: { in: ids } },
      select: { id: true, name: true, imageUrl: true, archived: true, visibility: true },
    });
    for (const row of rows) map.set(row.id, { type, ...row });
  } else if (type === "POWER") {
    const rows = await db.power.findMany({
      where: { campaignId, id: { in: ids } },
      select: { id: true, name: true, archived: true, visibility: true },
    });
    for (const row of rows)
      map.set(row.id, {
        type,
        id: row.id,
        name: row.name,
        imageUrl: null,
        archived: row.archived,
        visibility: row.visibility,
      });
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
 *
 * Player View (Fase 9, ver ARCHITECTURE.md, seção 21.2): `role` filtra em
 * dois níveis independentes quando é PLAYER — a própria relação não pode ser
 * GM_ONLY, **e** o "outro lado" dela não pode ser uma entidade GM_ONLY (senão
 * o nome/existência de algo oculto vazaria através do painel de relações de
 * uma entidade que o jogador pode ver). CO_GM/OWNER sempre veem tudo.
 */
export async function listRelationshipsForEntity(
  campaignId: string,
  type: RelatableEntityType,
  id: string,
  role: CampaignRole,
): Promise<ResolvedRelationship[]> {
  const rows = await db.relationship.findMany({
    where: {
      campaignId,
      ...relationshipsInvolvingEntity(type, id),
      visibility: isPlayerRole(role) ? { not: "GM_ONLY" } : undefined,
    },
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
    if (!canRoleSeeVisibility(role, other.visibility)) continue; // outro lado oculto para PLAYER

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
