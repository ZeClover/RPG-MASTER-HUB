import "server-only";

import type { CanonStatus, RelatableEntityType, Visibility } from "@/generated/prisma/client";
import { requireCampaignAccess } from "@/modules/core/permissions";
import { getEntityHref } from "@/modules/creation/relationships/config";
import { listRelationshipsForEntity, type ResolvedRelationship } from "@/modules/creation/relationships/queries";
import { getNpcForUser } from "@/modules/creation/npcs/queries";
import { getLocationForUser } from "@/modules/creation/locations/queries";
import { getFactionForUser } from "@/modules/creation/factions/queries";
import { getLorePageForUser } from "@/modules/creation/lore/queries";
import { getQuestForUser } from "@/modules/preparation/quests/queries";
import { getPlotThreadForUser } from "@/modules/preparation/plot-threads/queries";
import { getConsequenceForUser } from "@/modules/preparation/consequences/queries";
import { getTimelineEventForUser } from "@/modules/worldbuilding/timeline/queries";
import { getMysteryForUser, findCluesLinkedToEntity } from "@/modules/worldbuilding/mysteries/queries";
import { getMonsterForUser } from "@/modules/gametools/monsters/queries";
import { getItemForUser } from "@/modules/gametools/items/queries";
import { getPowerForUser } from "@/modules/gametools/powers/queries";
import { listFamilyRelationsForNpc } from "@/modules/worldbuilding/family-tree/queries";
import { groupFamilyRelationsForNpc, type FamilyGroups } from "@/modules/worldbuilding/family-tree/tree";
import {
  QUEST_STATUS_LABELS,
  PLOT_THREAD_STATUS_LABELS,
  CONSEQUENCE_STATUS_LABELS,
  MYSTERY_STATUS_LABELS,
} from "@/components/wiki/status-config";
import { RELATIONSHIP_IMPORTANCE_LABELS } from "@/modules/creation/relationships/config";

export interface ContextField {
  label: string;
  value: string;
}

export interface ContextTagRef {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

/**
 * "Raio-x" normalizado de uma entidade relacionável — o dado próprio dela,
 * resumido o bastante para caber num painel só, com um link para a ficha
 * completa (edição continua acontecendo lá, não aqui — ver ARCHITECTURE.md,
 * seção 18.2, sobre por que o Context Engine não reimplementa 12 formulários).
 */
export interface ContextSubject {
  type: RelatableEntityType;
  id: string;
  name: string;
  imageUrl: string | null;
  subtitle: string | null;
  canonStatus: CanonStatus | null;
  statusLabel: string | null;
  visibility: Visibility;
  favorite: boolean;
  archived: boolean;
  detailHref: string;
  fields: ContextField[];
  tags: ContextTagRef[];
  markdown: string | null;
  monsterAttributes: { key: string; value: string }[] | null;
  mysteryClues: { id: string; text: string; discovered: boolean }[] | null;
}

function nonEmptyFields(entries: [string, string | null | undefined][]): ContextField[] {
  return entries
    .filter((entry): entry is [string, string] => Boolean(entry[1] && entry[1].trim().length > 0))
    .map(([label, value]) => ({ label, value }));
}

async function loadSubject(
  userId: string,
  campaignId: string,
  type: RelatableEntityType,
  id: string,
): Promise<ContextSubject | null> {
  const detailHref = getEntityHref(campaignId, type, id);

  switch (type) {
    case "NPC": {
      const npc = await getNpcForUser(userId, campaignId, id);
      if (!npc) return null;
      return {
        type,
        id,
        name: npc.name,
        imageUrl: npc.imageUrl,
        subtitle: [npc.species, npc.age, npc.gender, npc.narrativeStatus].filter(Boolean).join(" · ") || null,
        canonStatus: npc.canonStatus,
        statusLabel: null,
        visibility: npc.visibility,
        favorite: npc.favorite,
        archived: npc.archived,
        detailHref,
        fields: nonEmptyFields([
          ["Aparência", npc.appearance],
          ["Personalidade", npc.personality],
          ["História", npc.history],
          ["Objetivos", npc.goals],
          ["Medos", npc.fears],
          ["Segredos", npc.secrets],
          ["Notas do Mestre", npc.gmNotes],
        ]),
        tags: npc.tags.map((entry) => entry.tag),
        markdown: null,
        monsterAttributes: null,
        mysteryClues: null,
      };
    }
    case "LOCATION": {
      const location = await getLocationForUser(userId, campaignId, id);
      if (!location) return null;
      return {
        type,
        id,
        name: location.name,
        imageUrl: location.imageUrl,
        subtitle: location.locationType,
        canonStatus: location.canonStatus,
        statusLabel: null,
        visibility: location.visibility,
        favorite: location.favorite,
        archived: location.archived,
        detailHref,
        fields: nonEmptyFields([
          ["Local pai", location.parent?.name ?? null],
          ["Descrição", location.description],
          ["Notas", location.notes],
        ]),
        tags: location.tags.map((entry) => entry.tag),
        markdown: null,
        monsterAttributes: null,
        mysteryClues: null,
      };
    }
    case "FACTION": {
      const faction = await getFactionForUser(userId, campaignId, id);
      if (!faction) return null;
      return {
        type,
        id,
        name: faction.name,
        imageUrl: faction.imageUrl,
        subtitle: faction.factionType,
        canonStatus: faction.canonStatus,
        statusLabel: null,
        visibility: faction.visibility,
        favorite: faction.favorite,
        archived: faction.archived,
        detailHref,
        fields: nonEmptyFields([
          ["Descrição", faction.description],
          ["História", faction.history],
          ["Objetivos", faction.goals],
          ["Recursos", faction.resources],
          ["Segredos", faction.secrets],
          ["Notas", faction.notes],
        ]),
        tags: faction.tags.map((entry) => entry.tag),
        markdown: null,
        monsterAttributes: null,
        mysteryClues: null,
      };
    }
    case "LORE_PAGE": {
      const lorePage = await getLorePageForUser(userId, campaignId, id);
      if (!lorePage) return null;
      return {
        type,
        id,
        name: lorePage.title,
        imageUrl: lorePage.imageUrl,
        subtitle: lorePage.category,
        canonStatus: lorePage.canonStatus,
        statusLabel: null,
        visibility: lorePage.visibility,
        favorite: lorePage.favorite,
        archived: lorePage.archived,
        detailHref,
        fields: [],
        tags: lorePage.tags.map((entry) => entry.tag),
        markdown: lorePage.content,
        monsterAttributes: null,
        mysteryClues: null,
      };
    }
    case "QUEST": {
      const quest = await getQuestForUser(userId, campaignId, id);
      if (!quest) return null;
      return {
        type,
        id,
        name: quest.title,
        imageUrl: null,
        subtitle: null,
        canonStatus: null,
        statusLabel: QUEST_STATUS_LABELS[quest.status],
        visibility: quest.visibility,
        favorite: quest.favorite,
        archived: quest.archived,
        detailHref,
        fields: nonEmptyFields([
          ["Descrição", quest.description],
          ["Objetivo", quest.objective],
          ["Recompensa", quest.reward],
        ]),
        tags: quest.tags.map((entry) => entry.tag),
        markdown: null,
        monsterAttributes: null,
        mysteryClues: null,
      };
    }
    case "PLOT_THREAD": {
      const plotThread = await getPlotThreadForUser(userId, campaignId, id);
      if (!plotThread) return null;
      return {
        type,
        id,
        name: plotThread.title,
        imageUrl: null,
        subtitle: `Importância: ${RELATIONSHIP_IMPORTANCE_LABELS[plotThread.importance]}`,
        canonStatus: null,
        statusLabel: PLOT_THREAD_STATUS_LABELS[plotThread.status],
        visibility: plotThread.visibility,
        favorite: plotThread.favorite,
        archived: plotThread.archived,
        detailHref,
        fields: nonEmptyFields([["Descrição", plotThread.description]]),
        tags: plotThread.tags.map((entry) => entry.tag),
        markdown: null,
        monsterAttributes: null,
        mysteryClues: null,
      };
    }
    case "CONSEQUENCE": {
      const consequence = await getConsequenceForUser(userId, campaignId, id);
      if (!consequence) return null;
      return {
        type,
        id,
        name: consequence.title,
        imageUrl: null,
        subtitle: null,
        canonStatus: null,
        statusLabel: CONSEQUENCE_STATUS_LABELS[consequence.status],
        visibility: consequence.visibility,
        favorite: consequence.favorite,
        archived: consequence.archived,
        detailHref,
        fields: nonEmptyFields([
          ["Gatilho", consequence.trigger],
          ["Descrição", consequence.description],
        ]),
        tags: consequence.tags.map((entry) => entry.tag),
        markdown: null,
        monsterAttributes: null,
        mysteryClues: null,
      };
    }
    case "TIMELINE_EVENT": {
      const event = await getTimelineEventForUser(userId, campaignId, id);
      if (!event) return null;
      return {
        type,
        id,
        name: event.title,
        imageUrl: null,
        subtitle: event.narrativeDate,
        canonStatus: null,
        statusLabel: null,
        visibility: event.visibility,
        favorite: event.favorite,
        archived: event.archived,
        detailHref,
        fields: nonEmptyFields([["Descrição", event.description]]),
        tags: event.tags.map((entry) => entry.tag),
        markdown: null,
        monsterAttributes: null,
        mysteryClues: null,
      };
    }
    case "MYSTERY": {
      const mystery = await getMysteryForUser(userId, campaignId, id);
      if (!mystery) return null;
      return {
        type,
        id,
        name: mystery.title,
        imageUrl: null,
        subtitle: null,
        canonStatus: null,
        statusLabel: MYSTERY_STATUS_LABELS[mystery.status],
        visibility: mystery.visibility,
        favorite: mystery.favorite,
        archived: mystery.archived,
        detailHref,
        fields: nonEmptyFields([["Descrição", mystery.description]]),
        tags: mystery.tags.map((entry) => entry.tag),
        markdown: null,
        monsterAttributes: null,
        mysteryClues: mystery.clues.map((clue) => ({ id: clue.id, text: clue.text, discovered: clue.discovered })),
      };
    }
    case "MONSTER": {
      const monster = await getMonsterForUser(userId, campaignId, id);
      if (!monster) return null;
      return {
        type,
        id,
        name: monster.name,
        imageUrl: monster.imageUrl,
        subtitle: monster.isBoss ? "Chefe" : "Monstro",
        canonStatus: monster.canonStatus,
        statusLabel: null,
        visibility: monster.visibility,
        favorite: monster.favorite,
        archived: monster.archived,
        detailHref,
        fields: nonEmptyFields([["Descrição", monster.description]]),
        tags: monster.tags.map((entry) => entry.tag),
        markdown: null,
        monsterAttributes: monster.attributes.map((attr) => ({ key: attr.key, value: attr.value })),
        mysteryClues: null,
      };
    }
    case "ITEM": {
      const item = await getItemForUser(userId, campaignId, id);
      if (!item) return null;
      return {
        type,
        id,
        name: item.name,
        imageUrl: item.imageUrl,
        subtitle: item.category,
        canonStatus: item.canonStatus,
        statusLabel: null,
        visibility: item.visibility,
        favorite: item.favorite,
        archived: item.archived,
        detailHref,
        fields: nonEmptyFields([
          ["Descrição", item.description],
          ["Efeito", item.effect],
        ]),
        tags: item.tags.map((entry) => entry.tag),
        markdown: null,
        monsterAttributes: null,
        mysteryClues: null,
      };
    }
    case "POWER": {
      const power = await getPowerForUser(userId, campaignId, id);
      if (!power) return null;
      return {
        type,
        id,
        name: power.name,
        imageUrl: null,
        subtitle: power.cost,
        canonStatus: power.canonStatus,
        statusLabel: null,
        visibility: power.visibility,
        favorite: power.favorite,
        archived: power.archived,
        detailHref,
        fields: nonEmptyFields([
          ["Descrição", power.description],
          ["Efeito", power.effect],
        ]),
        tags: power.tags.map((entry) => entry.tag),
        markdown: null,
        monsterAttributes: null,
        mysteryClues: null,
      };
    }
  }
}

export interface EntityContextBundle {
  subject: ContextSubject;
  relationships: ResolvedRelationship[];
  linkingClues: { id: string; text: string; mysteryId: string; mysteryTitle: string; mysteryHref: string }[];
  family: FamilyGroups | null;
}

/**
 * Ponto de entrada único do Context Engine (ver ARCHITECTURE.md, seção 18.2):
 * dado qualquer `RelatableEntityType` + id, junta os dados próprios da
 * entidade com TUDO que já existe apontando para ela — Relacionamentos (dos
 * dois lados, via `listRelationshipsForEntity`, já existente desde a Fase 1),
 * Pistas de Mistério que a citam (novo, mas só uma query — `findCluesLinkedToEntity`)
 * e, só para NPC, os parentescos do Family Tree (Fase 5, já existente).
 *
 * Fase 9 (permissões avançadas, ver ARCHITECTURE.md, seção 21.5): o Context
 * Engine é ferramenta do mestre (raio-x cruzando dados de várias entidades) —
 * a página que chama isto já exige CO_GM, e aqui a checagem é repetida
 * (mesmo padrão de defesa em profundidade do resto do projeto) só para obter
 * `role`, usado por `listRelationshipsForEntity`/`listFamilyRelationsForNpc`.
 */
export async function getEntityContext(
  userId: string,
  campaignId: string,
  type: RelatableEntityType,
  id: string,
): Promise<EntityContextBundle | null> {
  const { role } = await requireCampaignAccess(userId, campaignId, "CO_GM");
  const subject = await loadSubject(userId, campaignId, type, id);
  if (!subject) return null;

  const [relationships, clues, familyRelations] = await Promise.all([
    listRelationshipsForEntity(campaignId, type, id, role),
    findCluesLinkedToEntity(campaignId, type, id),
    type === "NPC" ? listFamilyRelationsForNpc(campaignId, id, role) : Promise.resolve(null),
  ]);

  return {
    subject,
    relationships,
    linkingClues: clues.map((clue) => ({
      id: clue.id,
      text: clue.text,
      mysteryId: clue.mystery.id,
      mysteryTitle: clue.mystery.title,
      mysteryHref: getEntityHref(campaignId, "MYSTERY", clue.mystery.id),
    })),
    family: familyRelations ? groupFamilyRelationsForNpc(id, familyRelations) : null,
  };
}
