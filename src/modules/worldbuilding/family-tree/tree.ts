import type { FamilyRelationType } from "@/generated/prisma/client";

export interface NpcRef {
  id: string;
  name: string;
  imageUrl: string | null;
  archived: boolean;
}

export interface FamilyRelationRow {
  id: string;
  relationType: FamilyRelationType;
  notes: string | null;
  npcA: NpcRef;
  npcB: NpcRef;
}

export interface FamilyTreeNode {
  npc: NpcRef;
  children: FamilyTreeNode[];
  spouses: NpcRef[];
  siblings: NpcRef[];
}

export interface FamilyGroupEntry {
  relationId: string;
  npc: NpcRef;
}

export interface FamilyGroups {
  parents: FamilyGroupEntry[];
  children: FamilyGroupEntry[];
  spouses: FamilyGroupEntry[];
  siblings: FamilyGroupEntry[];
}

/** Agrupa as relações de um NPC específico para o painel "Família" da página de detalhe dele. */
export function groupFamilyRelationsForNpc(npcId: string, relations: FamilyRelationRow[]): FamilyGroups {
  const groups: FamilyGroups = { parents: [], children: [], spouses: [], siblings: [] };

  for (const rel of relations) {
    const isA = rel.npcA.id === npcId;
    const other = isA ? rel.npcB : rel.npcA;

    if (rel.relationType === "PARENT_OF") {
      if (isA) groups.children.push({ relationId: rel.id, npc: other });
      else groups.parents.push({ relationId: rel.id, npc: other });
    } else if (rel.relationType === "SPOUSE_OF") {
      groups.spouses.push({ relationId: rel.id, npc: other });
    } else if (rel.relationType === "SIBLING_OF") {
      groups.siblings.push({ relationId: rel.id, npc: other });
    }
  }

  return groups;
}

/**
 * Monta a "árvore" a partir das linhas de FamilyRelation — função pura, sem
 * acesso a banco, para poder ser testada/reaproveitada tanto na página
 * dedicada quanto (no futuro) no painel de um NPC.
 *
 * Corte de escopo assumido (ver ARCHITECTURE.md, seção 16.3): quando um NPC
 * tem dois pais registrados que não têm uma relação de cônjuge entre si
 * (então nenhum dos dois é "filho" de ninguém, os dois viram raiz), o filho
 * aparece pendurado embaixo de apenas um dos dois ramos — não sob os dois ao
 * mesmo tempo. Um grafo genealógico "de verdade" (DAG com pais combinados)
 * é bem mais complexo de desenhar sem uma biblioteca de grafos; para o
 * volume esperado de uma campanha de mesa, uma árvore simples já comunica a
 * estrutura familiar, e cônjuges continuam aparecendo lado a lado como
 * anotação em cada nó.
 */
export function buildFamilyTrees(relations: FamilyRelationRow[]): FamilyTreeNode[] {
  const nodesById = new Map<string, NpcRef>();
  const childrenOf = new Map<string, NpcRef[]>();
  const hasParent = new Set<string>();
  const spousesOf = new Map<string, NpcRef[]>();
  const siblingsOf = new Map<string, NpcRef[]>();

  function remember(npc: NpcRef) {
    if (!nodesById.has(npc.id)) nodesById.set(npc.id, npc);
  }
  function push(map: Map<string, NpcRef[]>, key: string, value: NpcRef) {
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(value);
  }

  for (const rel of relations) {
    remember(rel.npcA);
    remember(rel.npcB);

    if (rel.relationType === "PARENT_OF") {
      push(childrenOf, rel.npcA.id, rel.npcB);
      hasParent.add(rel.npcB.id);
    } else if (rel.relationType === "SPOUSE_OF") {
      push(spousesOf, rel.npcA.id, rel.npcB);
      push(spousesOf, rel.npcB.id, rel.npcA);
    } else if (rel.relationType === "SIBLING_OF") {
      push(siblingsOf, rel.npcA.id, rel.npcB);
      push(siblingsOf, rel.npcB.id, rel.npcA);
    }
  }

  const visited = new Set<string>();

  function buildNode(id: string): FamilyTreeNode | null {
    if (visited.has(id)) return null;
    visited.add(id);
    const npc = nodesById.get(id);
    if (!npc) return null;

    return {
      npc,
      children: (childrenOf.get(id) ?? [])
        .map((child) => buildNode(child.id))
        .filter((node): node is FamilyTreeNode => node !== null),
      spouses: spousesOf.get(id) ?? [],
      siblings: siblingsOf.get(id) ?? [],
    };
  }

  const roots: FamilyTreeNode[] = [];
  for (const id of nodesById.keys()) {
    if (!hasParent.has(id)) {
      const node = buildNode(id);
      if (node) roots.push(node);
    }
  }
  // Defensivo: cobre ciclos (A pai de B, B pai de A) que deixariam os dois de fora do laço acima.
  for (const id of nodesById.keys()) {
    if (!visited.has(id)) {
      const node = buildNode(id);
      if (node) roots.push(node);
    }
  }

  return roots;
}
