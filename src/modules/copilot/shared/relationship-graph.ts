import "server-only";

import { db } from "@/lib/db";
import type { RelatableEntityType } from "@/generated/prisma/client";
import { resolveEntityRefs, type EntityRef } from "@/modules/creation/relationships/queries";

/**
 * Carregador compartilhado por Lore Guardian e Canon Checker (Fase 8, ver
 * ARCHITECTURE.md, seção 19): ambos precisam da mesma coisa — todas as linhas
 * de `Relationship` da campanha, com os dois lados resolvidos (nome/arquivado)
 * contra a tabela concreta certa. Reaproveita `resolveEntityRefs`
 * (`creation/relationships/queries.ts`, Fase 1) em vez de duplicar a
 * resolução polimórfica em lote por tipo.
 */
export interface RelationshipRow {
  id: string;
  sourceType: RelatableEntityType;
  sourceId: string;
  targetType: RelatableEntityType;
  targetId: string;
  type: string;
  description: string | null;
}

export function loadAllRelationships(campaignId: string): Promise<RelationshipRow[]> {
  return db.relationship.findMany({
    where: { campaignId },
    select: {
      id: true,
      sourceType: true,
      sourceId: true,
      targetType: true,
      targetId: true,
      type: true,
      description: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export function groupIdsByType(rows: RelationshipRow[]): Map<RelatableEntityType, Set<string>> {
  const idsByType = new Map<RelatableEntityType, Set<string>>();
  for (const row of rows) {
    if (!idsByType.has(row.sourceType)) idsByType.set(row.sourceType, new Set());
    idsByType.get(row.sourceType)!.add(row.sourceId);
    if (!idsByType.has(row.targetType)) idsByType.set(row.targetType, new Set());
    idsByType.get(row.targetType)!.add(row.targetId);
  }
  return idsByType;
}

export function entityKey(type: RelatableEntityType, id: string): string {
  return `${type}:${id}`;
}

/** Uma query por tipo envolvido (no máximo 12), nunca uma por relação — mesmo cuidado de N+1 da Fase 1/7. */
export async function resolveAllEndpoints(
  campaignId: string,
  idsByType: Map<RelatableEntityType, Set<string>>,
): Promise<Map<string, EntityRef>> {
  const merged = new Map<string, EntityRef>();
  await Promise.all(
    [...idsByType.entries()].map(async ([type, ids]) => {
      const resolved = await resolveEntityRefs(campaignId, type, [...ids]);
      for (const [id, ref] of resolved) merged.set(entityKey(type, id), ref);
    }),
  );
  return merged;
}
