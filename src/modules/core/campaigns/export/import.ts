import "server-only";

import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { EXPORT_DATA_LABELS, type CampaignExportData, type CampaignExportV1, type RelatableEntityTypeExport } from "@/modules/core/campaigns/export/schemas";

export interface ImportSummary {
  /** Linhas efetivamente inseridas por tipo de conteúdo (mesmas chaves de `CampaignExportData`). */
  counts: Partial<Record<keyof CampaignExportData, number>>;
  /** Avisos legíveis por humanos: personagens reatribuídos, relações/pistas que não puderam ser resolvidas, etc. */
  warnings: string[];
}

function relKey(type: RelatableEntityTypeExport, id: string) {
  return `${type}:${id}`;
}

/** Insere cada linha individualmente (não `createMany`, porque precisamos do `id` novo de volta) e devolve o mapa oldId→newId. */
async function insertIndependent<TRow extends { id: string }>(
  rows: TRow[],
  createFn: (row: TRow) => Promise<{ id: string }>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const row of rows) {
    const created = await createFn(row);
    map.set(row.id, created.id);
  }
  return map;
}

/** Mesma ideia de `insertIndependent`, mas para junções sem `id` próprio (as 13 tabelas de Tag) — só conta quantas linhas entraram. */
async function insertJoins<TRow>(rows: TRow[], createFn: (row: TRow) => Promise<unknown>): Promise<number> {
  let count = 0;
  for (const row of rows) {
    await createFn(row);
    count += 1;
  }
  return count;
}

function requireMapped(map: Map<string, string>, oldId: string, what: string): string {
  const newId = map.get(oldId);
  if (!newId) {
    // Só pode acontecer com um arquivo de export corrompido/adulterado à mão —
    // o export (Part 1) é exaustivo, então todo pai referenciado por um filho
    // sempre está no mesmo arquivo. Preferimos abortar a transação inteira
    // (nada é persistido) a deixar uma campanha pela metade no banco.
    throw new Error(`Arquivo de import inconsistente: ${what} não encontrado (id ${oldId}).`);
  }
  return newId;
}

/**
 * Cria uma campanha NOVA a partir de um documento de export (Fase 12, Part 2
 * — ver ARCHITECTURE.md). Regra de ouro, não-negociável: isto NUNCA sobrescreve
 * ou mescla numa campanha existente — sempre `campaign.create`, sempre um
 * `CampaignMember` novo com `userId` como OWNER, mesmo que o arquivo tenha sido
 * exportado da própria conta de quem está importando.
 *
 * Todo `id` do arquivo é substituído por um `cuid()` novo do Prisma — nunca
 * passamos um `id` do arquivo para `create`. Um mapa `oldId → newId` por tipo
 * de entidade é construído incrementalmente e consultado antes de inserir
 * qualquer linha que tenha uma referência (FK real ou polimórfica) para uma
 * entidade já inserida — ver a ordem topológica comentada abaixo.
 *
 * Toda a operação roda em UMA transação interativa: se qualquer coisa lançar
 * no meio do caminho, nada fica gravado (nenhuma campanha pela metade).
 */
export async function importCampaignExport(
  userId: string,
  doc: CampaignExportV1,
): Promise<{ campaignId: string; summary: ImportSummary }> {
  if (doc.formatVersion !== 1) {
    throw new Error("Formato de arquivo de import não suportado (formatVersion precisa ser 1).");
  }

  const warnings: string[] = [];
  const counts: Partial<Record<keyof CampaignExportData, number>> = {};

  const campaignId = await db.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const campaign = await tx.campaign.create({
        data: {
          ownerId: userId,
          name: doc.campaign.name,
          description: doc.campaign.description,
          imageUrl: doc.campaign.imageUrl,
          bannerUrl: doc.campaign.bannerUrl,
          iconUrl: doc.campaign.iconUrl,
          symbolUrl: doc.campaign.symbolUrl,
          backgroundUrl: doc.campaign.backgroundUrl,
          primaryColor: doc.campaign.primaryColor,
          secondaryColor: doc.campaign.secondaryColor,
          lastSessionAt: doc.campaign.lastSessionAt ? new Date(doc.campaign.lastSessionAt) : null,
          nextSessionAt: doc.campaign.nextSessionAt ? new Date(doc.campaign.nextSessionAt) : null,
          // `status`/`archivedAt` do export são DELIBERADAMENTE ignorados: uma
          // campanha importada sempre nasce ACTIVE, mesmo que o backup tenha
          // sido tirado de uma campanha já arquivada — ver ARCHITECTURE.md.
          members: { create: { userId, role: "OWNER" } },
        },
      });
      const newCampaignId = campaign.id;

      // Mapa combinado (type:oldId → newId) para os 12 `RelatableEntityType` —
      // alimentado por cada id-map relevante assim que ele é construído.
      // Serve tanto ao `Relationship` (Part 2, passo 5) quanto ao
      // `Clue.linkedEntityId` opcional (passo 3).
      const relEntityIdMap = new Map<string, string>();
      function mergeIntoRelMap(type: RelatableEntityTypeExport, map: Map<string, string>) {
        for (const [oldId, newId] of map) relEntityIdMap.set(relKey(type, oldId), newId);
      }

      // ── Passo 1 — filhos diretos de Campaign, sem dependência entre si ────

      const npcIdMap = await insertIndependent(doc.data.npcs, (row) =>
        tx.npc.create({
          data: {
            campaignId: newCampaignId,
            name: row.name,
            imageUrl: row.imageUrl,
            age: row.age,
            species: row.species,
            gender: row.gender,
            appearance: row.appearance,
            personality: row.personality,
            history: row.history,
            goals: row.goals,
            fears: row.fears,
            secrets: row.secrets,
            narrativeStatus: row.narrativeStatus,
            gmNotes: row.gmNotes,
            canonStatus: row.canonStatus,
            visibility: row.visibility,
            favorite: row.favorite,
            archived: row.archived,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      mergeIntoRelMap("NPC", npcIdMap);
      counts.npcs = npcIdMap.size;

      const factionIdMap = await insertIndependent(doc.data.factions, (row) =>
        tx.faction.create({
          data: {
            campaignId: newCampaignId,
            name: row.name,
            imageUrl: row.imageUrl,
            factionType: row.factionType,
            description: row.description,
            history: row.history,
            goals: row.goals,
            resources: row.resources,
            secrets: row.secrets,
            notes: row.notes,
            canonStatus: row.canonStatus,
            visibility: row.visibility,
            favorite: row.favorite,
            archived: row.archived,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      mergeIntoRelMap("FACTION", factionIdMap);
      counts.factions = factionIdMap.size;

      const lorePageIdMap = await insertIndependent(doc.data.lorePages, (row) =>
        tx.lorePage.create({
          data: {
            campaignId: newCampaignId,
            title: row.title,
            content: row.content,
            imageUrl: row.imageUrl,
            category: row.category,
            canonStatus: row.canonStatus,
            visibility: row.visibility,
            favorite: row.favorite,
            archived: row.archived,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      mergeIntoRelMap("LORE_PAGE", lorePageIdMap);
      counts.lorePages = lorePageIdMap.size;

      const ideaIdMap = await insertIndependent(doc.data.ideas, (row) =>
        tx.idea.create({
          data: {
            campaignId: newCampaignId,
            title: row.title,
            content: row.content,
            state: row.state,
            favorite: row.favorite,
            archived: row.archived,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      counts.ideas = ideaIdMap.size;

      const tagIdMap = await insertIndependent(doc.data.tags, (row) =>
        tx.tag.create({
          data: {
            campaignId: newCampaignId,
            name: row.name,
            slug: row.slug,
            color: row.color,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      counts.tags = tagIdMap.size;

      const questIdMap = await insertIndependent(doc.data.quests, (row) =>
        tx.quest.create({
          data: {
            campaignId: newCampaignId,
            title: row.title,
            description: row.description,
            objective: row.objective,
            reward: row.reward,
            status: row.status,
            visibility: row.visibility,
            favorite: row.favorite,
            archived: row.archived,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      mergeIntoRelMap("QUEST", questIdMap);
      counts.quests = questIdMap.size;

      const plotThreadIdMap = await insertIndependent(doc.data.plotThreads, (row) =>
        tx.plotThread.create({
          data: {
            campaignId: newCampaignId,
            title: row.title,
            description: row.description,
            status: row.status,
            importance: row.importance,
            visibility: row.visibility,
            favorite: row.favorite,
            archived: row.archived,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      mergeIntoRelMap("PLOT_THREAD", plotThreadIdMap);
      counts.plotThreads = plotThreadIdMap.size;

      const consequenceIdMap = await insertIndependent(doc.data.consequences, (row) =>
        tx.consequence.create({
          data: {
            campaignId: newCampaignId,
            title: row.title,
            trigger: row.trigger,
            description: row.description,
            status: row.status,
            visibility: row.visibility,
            favorite: row.favorite,
            archived: row.archived,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      mergeIntoRelMap("CONSEQUENCE", consequenceIdMap);
      counts.consequences = consequenceIdMap.size;

      const timelineEventIdMap = await insertIndependent(doc.data.timelineEvents, (row) =>
        tx.timelineEvent.create({
          data: {
            campaignId: newCampaignId,
            title: row.title,
            description: row.description,
            narrativeDate: row.narrativeDate,
            order: row.order,
            visibility: row.visibility,
            favorite: row.favorite,
            archived: row.archived,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      mergeIntoRelMap("TIMELINE_EVENT", timelineEventIdMap);
      counts.timelineEvents = timelineEventIdMap.size;

      const narrativeClockIdMap = await insertIndependent(doc.data.narrativeClocks, (row) =>
        tx.narrativeClock.create({
          data: {
            campaignId: newCampaignId,
            title: row.title,
            description: row.description,
            segments: row.segments,
            filled: row.filled,
            favorite: row.favorite,
            archived: row.archived,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      counts.narrativeClocks = narrativeClockIdMap.size;

      const mysteryIdMap = await insertIndependent(doc.data.mysteries, (row) =>
        tx.mystery.create({
          data: {
            campaignId: newCampaignId,
            title: row.title,
            description: row.description,
            status: row.status,
            visibility: row.visibility,
            favorite: row.favorite,
            archived: row.archived,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      mergeIntoRelMap("MYSTERY", mysteryIdMap);
      counts.mysteries = mysteryIdMap.size;

      const monsterIdMap = await insertIndependent(doc.data.monsters, (row) =>
        tx.monster.create({
          data: {
            campaignId: newCampaignId,
            name: row.name,
            imageUrl: row.imageUrl,
            isBoss: row.isBoss,
            description: row.description,
            canonStatus: row.canonStatus,
            visibility: row.visibility,
            favorite: row.favorite,
            archived: row.archived,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      mergeIntoRelMap("MONSTER", monsterIdMap);
      counts.monsters = monsterIdMap.size;

      const itemIdMap = await insertIndependent(doc.data.items, (row) =>
        tx.item.create({
          data: {
            campaignId: newCampaignId,
            name: row.name,
            imageUrl: row.imageUrl,
            category: row.category,
            description: row.description,
            effect: row.effect,
            canonStatus: row.canonStatus,
            visibility: row.visibility,
            favorite: row.favorite,
            archived: row.archived,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      mergeIntoRelMap("ITEM", itemIdMap);
      counts.items = itemIdMap.size;

      const powerIdMap = await insertIndependent(doc.data.powers, (row) =>
        tx.power.create({
          data: {
            campaignId: newCampaignId,
            name: row.name,
            cost: row.cost,
            description: row.description,
            effect: row.effect,
            canonStatus: row.canonStatus,
            visibility: row.visibility,
            favorite: row.favorite,
            archived: row.archived,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      mergeIntoRelMap("POWER", powerIdMap);
      counts.powers = powerIdMap.size;

      const rollTableIdMap = await insertIndependent(doc.data.rollTables, (row) =>
        tx.rollTable.create({
          data: {
            campaignId: newCampaignId,
            name: row.name,
            description: row.description,
            kind: row.kind,
            favorite: row.favorite,
            archived: row.archived,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      counts.rollTables = rollTableIdMap.size;

      const handoutIdMap = await insertIndependent(doc.data.handouts, (row) =>
        tx.handout.create({
          data: {
            campaignId: newCampaignId,
            title: row.title,
            content: row.content,
            imageUrl: row.imageUrl,
            revealed: row.revealed,
            revealedAt: row.revealedAt ? new Date(row.revealedAt) : null,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      counts.handouts = handoutIdMap.size;

      const moduleSettingIdMap = await insertIndependent(doc.data.campaignModuleSettings, (row) =>
        tx.campaignModuleSetting.create({
          data: { campaignId: newCampaignId, moduleKey: row.moduleKey, enabled: row.enabled },
        }),
      );
      counts.campaignModuleSettings = moduleSettingIdMap.size;

      const customCategoryIdMap = await insertIndependent(doc.data.customCategories, (row) =>
        tx.customCategory.create({
          data: {
            campaignId: newCampaignId,
            name: row.name,
            description: row.description,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      counts.customCategories = customCategoryIdMap.size;

      const audioTrackIdMap = await insertIndependent(doc.data.audioTracks, (row) =>
        tx.audioTrack.create({
          data: {
            campaignId: newCampaignId,
            name: row.name,
            category: row.category,
            fileUrl: row.fileUrl,
            loop: row.loop,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      counts.audioTracks = audioTrackIdMap.size;

      // CampaignCalendar é singleton (0 ou 1 linha).
      let campaignCalendarCount = 0;
      for (const row of doc.data.campaignCalendars) {
        await tx.campaignCalendar.create({
          data: { campaignId: newCampaignId, currentDay: row.currentDay, dayLabel: row.dayLabel },
        });
        campaignCalendarCount += 1;
      }
      counts.campaignCalendars = campaignCalendarCount;

      const sessionPlanIdMap = await insertIndependent(doc.data.sessionPlans, (row) =>
        tx.sessionPlan.create({
          data: {
            campaignId: newCampaignId,
            title: row.title,
            sessionNumber: row.sessionNumber,
            plannedDate: row.plannedDate ? new Date(row.plannedDate) : null,
            pitch: row.pitch,
            gmNotes: row.gmNotes,
            status: row.status,
            favorite: row.favorite,
            archived: row.archived,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      counts.sessionPlans = sessionPlanIdMap.size;

      // ── Passo 2 — Location, duas passadas (hierarquia self-referencial) ──

      const locationIdMap = new Map<string, string>();
      for (const row of doc.data.locations) {
        const created = await tx.location.create({
          data: {
            campaignId: newCampaignId,
            name: row.name,
            imageUrl: row.imageUrl,
            description: row.description,
            locationType: row.locationType,
            notes: row.notes,
            parentLocationId: null, // passo B abaixo resolve o pai já remapeado
            canonStatus: row.canonStatus,
            visibility: row.visibility,
            favorite: row.favorite,
            archived: row.archived,
            createdAt: new Date(row.createdAt),
          },
        });
        locationIdMap.set(row.id, created.id);
      }
      mergeIntoRelMap("LOCATION", locationIdMap);
      for (const row of doc.data.locations) {
        if (!row.parentLocationId) continue;
        const newId = requireMapped(locationIdMap, row.id, "Location (recém-criado)");
        const newParentId = requireMapped(locationIdMap, row.parentLocationId, "Location pai");
        await tx.location.update({ where: { id: newId }, data: { parentLocationId: newParentId } });
      }
      counts.locations = locationIdMap.size;

      // ── Passo 3 — filhos que dependem de um id-map do passo 1/2 ──────────

      const monsterAttributeIdMap = await insertIndependent(doc.data.monsterAttributes, (row) =>
        tx.monsterAttribute.create({
          data: {
            monsterId: requireMapped(monsterIdMap, row.monsterId, "Monster"),
            key: row.key,
            value: row.value,
            order: row.order,
          },
        }),
      );
      counts.monsterAttributes = monsterAttributeIdMap.size;

      const rollTableEntryIdMap = await insertIndependent(doc.data.rollTableEntries, (row) =>
        tx.rollTableEntry.create({
          data: {
            tableId: requireMapped(rollTableIdMap, row.tableId, "RollTable"),
            label: row.label,
            weight: row.weight,
            order: row.order,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      counts.rollTableEntries = rollTableEntryIdMap.size;

      const customCategoryEntryIdMap = await insertIndependent(doc.data.customCategoryEntries, (row) =>
        tx.customCategoryEntry.create({
          data: {
            categoryId: requireMapped(customCategoryIdMap, row.categoryId, "CustomCategory"),
            title: row.title,
            content: row.content,
            imageUrl: row.imageUrl,
            visibility: row.visibility,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      counts.customCategoryEntries = customCategoryEntryIdMap.size;

      let nulledClueLinks = 0;
      const clueIdMap = await insertIndependent(doc.data.clues, (row) => {
        let linkedEntityType: RelatableEntityTypeExport | null = row.linkedEntityType;
        let linkedEntityId: string | null = row.linkedEntityId;
        if (linkedEntityType && linkedEntityId) {
          const resolved = relEntityIdMap.get(relKey(linkedEntityType, linkedEntityId));
          if (resolved) {
            linkedEntityId = resolved;
          } else {
            // Defensivo (ver ARCHITECTURE.md) — não deveria acontecer, já que o
            // export é exaustivo, mas preferimos preservar o texto da pista
            // sem o vínculo a abortar o import inteiro por causa dela.
            linkedEntityType = null;
            linkedEntityId = null;
            nulledClueLinks += 1;
          }
        }
        return tx.clue.create({
          data: {
            mysteryId: requireMapped(mysteryIdMap, row.mysteryId, "Mystery"),
            text: row.text,
            discovered: row.discovered,
            sharedWithPlayers: row.sharedWithPlayers,
            order: row.order,
            linkedEntityType,
            linkedEntityId,
            createdAt: new Date(row.createdAt),
          },
        });
      });
      counts.clues = clueIdMap.size;
      if (nulledClueLinks > 0) {
        warnings.push(
          `${nulledClueLinks} pista(s) do Mystery Board perderam o vínculo com uma entidade (não encontrada no arquivo) — o texto da pista foi preservado, só o link foi removido.`,
        );
      }

      const familyRelationIdMap = await insertIndependent(doc.data.familyRelations, (row) =>
        tx.familyRelation.create({
          data: {
            campaignId: newCampaignId,
            npcAId: requireMapped(npcIdMap, row.npcAId, "Npc (lado A do parentesco)"),
            npcBId: requireMapped(npcIdMap, row.npcBId, "Npc (lado B do parentesco)"),
            relationType: row.relationType,
            notes: row.notes,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      counts.familyRelations = familyRelationIdMap.size;

      const sceneIdMap = await insertIndependent(doc.data.scenes, (row) =>
        tx.scene.create({
          data: {
            campaignId: newCampaignId,
            sessionPlanId: requireMapped(sessionPlanIdMap, row.sessionPlanId, "SessionPlan"),
            title: row.title,
            summary: row.summary,
            readAloud: row.readAloud,
            goal: row.goal,
            order: row.order,
            status: row.status,
            favorite: row.favorite,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      counts.scenes = sceneIdMap.size;

      const checklistItemIdMap = await insertIndependent(doc.data.checklistItems, (row) =>
        tx.checklistItem.create({
          data: {
            sessionPlanId: requireMapped(sessionPlanIdMap, row.sessionPlanId, "SessionPlan"),
            label: row.label,
            done: row.done,
            order: row.order,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      counts.checklistItems = checklistItemIdMap.size;

      const sessionLogEntryIdMap = await insertIndependent(doc.data.sessionLogEntries, (row) =>
        tx.sessionLogEntry.create({
          data: {
            campaignId: newCampaignId,
            sessionPlanId: row.sessionPlanId ? requireMapped(sessionPlanIdMap, row.sessionPlanId, "SessionPlan") : null,
            type: row.type,
            content: row.content,
            clientId: row.clientId,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      counts.sessionLogEntries = sessionLogEntryIdMap.size;

      // CombatEncounter: `activeCombatantId` aponta para um Combatant, que só
      // existe DEPOIS deste passo — criamos com `null` aqui e resolvemos numa
      // segunda passada logo abaixo (mesma técnica de duas passadas do Location).
      const combatEncounterIdMap = new Map<string, string>();
      for (const row of doc.data.combatEncounters) {
        const created = await tx.combatEncounter.create({
          data: {
            campaignId: newCampaignId,
            sessionPlanId: row.sessionPlanId ? requireMapped(sessionPlanIdMap, row.sessionPlanId, "SessionPlan") : null,
            name: row.name,
            round: row.round,
            activeCombatantId: null,
            endedAt: row.endedAt ? new Date(row.endedAt) : null,
            createdAt: new Date(row.createdAt),
          },
        });
        combatEncounterIdMap.set(row.id, created.id);
      }
      counts.combatEncounters = combatEncounterIdMap.size;

      const combatantIdMap = await insertIndependent(doc.data.combatants, (row) =>
        tx.combatant.create({
          data: {
            encounterId: requireMapped(combatEncounterIdMap, row.encounterId, "CombatEncounter"),
            name: row.name,
            type: row.type,
            initiative: row.initiative,
            hpCurrent: row.hpCurrent,
            hpMax: row.hpMax,
            conditions: row.conditions,
            order: row.order,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      counts.combatants = combatantIdMap.size;

      for (const row of doc.data.combatEncounters) {
        if (!row.activeCombatantId) continue;
        const newCombatantId = combatantIdMap.get(row.activeCombatantId);
        if (!newCombatantId) continue; // defensivo: combatente ativo não fazia parte do export, não bloqueia o resto
        const newEncounterId = requireMapped(combatEncounterIdMap, row.id, "CombatEncounter (recém-criado)");
        await tx.combatEncounter.update({ where: { id: newEncounterId }, data: { activeCombatantId: newCombatantId } });
      }

      // ── Passo 4 — as 13 junções de Tag ────────────────────────────────────

      const npcTagCount = await insertJoins(doc.data.npcTags, (row) =>
        tx.npcTag.create({
          data: {
            npcId: requireMapped(npcIdMap, row.npcId, "Npc (npcTags)"),
            tagId: requireMapped(tagIdMap, row.tagId, "Tag (npcTags)"),
          },
        }),
      );
      counts.npcTags = npcTagCount;

      const locationTagCount = await insertJoins(doc.data.locationTags, (row) =>
        tx.locationTag.create({
          data: {
            locationId: requireMapped(locationIdMap, row.locationId, "Location (locationTags)"),
            tagId: requireMapped(tagIdMap, row.tagId, "Tag (locationTags)"),
          },
        }),
      );
      counts.locationTags = locationTagCount;

      const factionTagCount = await insertJoins(doc.data.factionTags, (row) =>
        tx.factionTag.create({
          data: {
            factionId: requireMapped(factionIdMap, row.factionId, "Faction (factionTags)"),
            tagId: requireMapped(tagIdMap, row.tagId, "Tag (factionTags)"),
          },
        }),
      );
      counts.factionTags = factionTagCount;

      const lorePageTagCount = await insertJoins(doc.data.lorePageTags, (row) =>
        tx.lorePageTag.create({
          data: {
            lorePageId: requireMapped(lorePageIdMap, row.lorePageId, "LorePage (lorePageTags)"),
            tagId: requireMapped(tagIdMap, row.tagId, "Tag (lorePageTags)"),
          },
        }),
      );
      counts.lorePageTags = lorePageTagCount;

      const ideaTagCount = await insertJoins(doc.data.ideaTags, (row) =>
        tx.ideaTag.create({
          data: {
            ideaId: requireMapped(ideaIdMap, row.ideaId, "Idea (ideaTags)"),
            tagId: requireMapped(tagIdMap, row.tagId, "Tag (ideaTags)"),
          },
        }),
      );
      counts.ideaTags = ideaTagCount;

      const questTagCount = await insertJoins(doc.data.questTags, (row) =>
        tx.questTag.create({
          data: {
            questId: requireMapped(questIdMap, row.questId, "Quest (questTags)"),
            tagId: requireMapped(tagIdMap, row.tagId, "Tag (questTags)"),
          },
        }),
      );
      counts.questTags = questTagCount;

      const plotThreadTagCount = await insertJoins(doc.data.plotThreadTags, (row) =>
        tx.plotThreadTag.create({
          data: {
            plotThreadId: requireMapped(plotThreadIdMap, row.plotThreadId, "PlotThread (plotThreadTags)"),
            tagId: requireMapped(tagIdMap, row.tagId, "Tag (plotThreadTags)"),
          },
        }),
      );
      counts.plotThreadTags = plotThreadTagCount;

      const consequenceTagCount = await insertJoins(doc.data.consequenceTags, (row) =>
        tx.consequenceTag.create({
          data: {
            consequenceId: requireMapped(consequenceIdMap, row.consequenceId, "Consequence (consequenceTags)"),
            tagId: requireMapped(tagIdMap, row.tagId, "Tag (consequenceTags)"),
          },
        }),
      );
      counts.consequenceTags = consequenceTagCount;

      const timelineEventTagCount = await insertJoins(doc.data.timelineEventTags, (row) =>
        tx.timelineEventTag.create({
          data: {
            timelineEventId: requireMapped(timelineEventIdMap, row.timelineEventId, "TimelineEvent (timelineEventTags)"),
            tagId: requireMapped(tagIdMap, row.tagId, "Tag (timelineEventTags)"),
          },
        }),
      );
      counts.timelineEventTags = timelineEventTagCount;

      const mysteryTagCount = await insertJoins(doc.data.mysteryTags, (row) =>
        tx.mysteryTag.create({
          data: {
            mysteryId: requireMapped(mysteryIdMap, row.mysteryId, "Mystery (mysteryTags)"),
            tagId: requireMapped(tagIdMap, row.tagId, "Tag (mysteryTags)"),
          },
        }),
      );
      counts.mysteryTags = mysteryTagCount;

      const monsterTagCount = await insertJoins(doc.data.monsterTags, (row) =>
        tx.monsterTag.create({
          data: {
            monsterId: requireMapped(monsterIdMap, row.monsterId, "Monster (monsterTags)"),
            tagId: requireMapped(tagIdMap, row.tagId, "Tag (monsterTags)"),
          },
        }),
      );
      counts.monsterTags = monsterTagCount;

      const itemTagCount = await insertJoins(doc.data.itemTags, (row) =>
        tx.itemTag.create({
          data: {
            itemId: requireMapped(itemIdMap, row.itemId, "Item (itemTags)"),
            tagId: requireMapped(tagIdMap, row.tagId, "Tag (itemTags)"),
          },
        }),
      );
      counts.itemTags = itemTagCount;

      const powerTagCount = await insertJoins(doc.data.powerTags, (row) =>
        tx.powerTag.create({
          data: {
            powerId: requireMapped(powerIdMap, row.powerId, "Power (powerTags)"),
            tagId: requireMapped(tagIdMap, row.tagId, "Tag (powerTags)"),
          },
        }),
      );
      counts.powerTags = powerTagCount;

      // ── Passo 5 — Relationship (por último, precisa de todos os id-maps) ─

      let skippedRelationships = 0;
      const relationshipRowsToCreate: Prisma.RelationshipCreateManyInput[] = [];
      for (const row of doc.data.relationships) {
        const newSourceId = relEntityIdMap.get(relKey(row.sourceType, row.sourceId));
        const newTargetId = relEntityIdMap.get(relKey(row.targetType, row.targetId));
        if (!newSourceId || !newTargetId) {
          skippedRelationships += 1;
          continue;
        }
        relationshipRowsToCreate.push({
          campaignId: newCampaignId,
          sourceType: row.sourceType,
          sourceId: newSourceId,
          targetType: row.targetType,
          targetId: newTargetId,
          type: row.type,
          description: row.description,
          importance: row.importance,
          visibility: row.visibility,
          createdAt: new Date(row.createdAt),
        });
      }
      if (relationshipRowsToCreate.length > 0) {
        await tx.relationship.createMany({ data: relationshipRowsToCreate });
      }
      counts.relationships = relationshipRowsToCreate.length;
      if (skippedRelationships > 0) {
        warnings.push(
          `${skippedRelationships} relacionamento(s) foram ignorados porque um dos lados não foi encontrado no arquivo.`,
        );
      }

      // ── Character: joga fora o dono original, reatribui para quem importou ─

      const characterIdMap = await insertIndependent(doc.data.characters, (row) =>
        tx.character.create({
          data: {
            campaignId: newCampaignId,
            playerId: userId,
            name: row.name,
            concept: row.concept,
            imageUrl: row.imageUrl,
            bio: row.bio,
            gmNotes: row.gmNotes,
            createdAt: new Date(row.createdAt),
          },
        }),
      );
      counts.characters = characterIdMap.size;
      if (characterIdMap.size > 0) {
        warnings.push(
          `${characterIdMap.size} personagem(ns) foram importados e reatribuídos a você — o(s) jogador(es) original(is) não fazem parte desta campanha nova (ver regra de ouro do import).`,
        );
      }

      return newCampaignId;
    },
    { timeout: 30_000 },
  );

  return { campaignId, summary: { counts, warnings } };
}

export { EXPORT_DATA_LABELS };
