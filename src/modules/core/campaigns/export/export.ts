import "server-only";

import { db } from "@/lib/db";
import {
  EXPORT_DATA_LABELS,
  type CampaignExportData,
  type CampaignExportV1,
} from "@/modules/core/campaigns/export/schemas";

/**
 * Converte uma linha do Prisma para o shape "pronto para JSON" do contrato de
 * export: descarta `campaignId` (implícito — todo array de `data` já pertence
 * a uma única campanha) e serializa qualquer `Date` para ISO 8601, porque o
 * documento devolvido por `buildCampaignExport` já É o JSON final (ver
 * `schemas.ts`), não um objeto intermediário com `Date`s a converter depois.
 */
function serializeRow<T extends Record<string, unknown>>(row: T): Omit<T, "campaignId"> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === "campaignId") continue;
    output[key] = value instanceof Date ? value.toISOString() : value;
  }
  return output as Omit<T, "campaignId">;
}

function serializeAll<T extends Record<string, unknown>>(rows: T[]): Omit<T, "campaignId">[] {
  return rows.map(serializeRow);
}

/**
 * Monta o documento de export/backup completo de uma campanha — Fase 12, Part
 * 1 (ver ARCHITECTURE.md). Função pura de leitura: não faz checagem de
 * permissão (isso é responsabilidade de quem chama — a rota de export exige
 * OWNER, o cron de backup roda com o próprio `CRON_SECRET` como autorização).
 *
 * A lista de modelos abaixo é DELIBERADAMENTE EXAUSTIVA e espelha 1:1 o
 * levantamento em `schemas.ts`/`CampaignExportData` — export ignora o estado
 * de `CampaignModuleSetting` (liga/desliga de módulo) porque um backup precisa
 * ser completo independente do que está visível na navegação agora.
 *
 * Ficam de fora (ver o comentário completo em `schemas.ts`, acima de
 * `campaignExportSchema`): `CampaignMember`, `DiscordLink`,
 * `MusicPlaybackState`, `SfxTriggerEvent`.
 *
 * Mídia (`imageUrl`/`fileUrl`/`bannerUrl`/...) não é baixada nem reencodada
 * aqui — as URLs do Vercel Blob são mantidas como texto. Isso funciona porque
 * o Blob desta aplicação é Public e as URLs não expiram (ver ARCHITECTURE.md,
 * seção "Storage") — limitação conhecida: se o Blob store for zerado algum
 * dia, links de mídia antigos quebram. Não é resolvido nesta fase.
 */
export async function buildCampaignExport(campaignId: string): Promise<CampaignExportV1> {
  const campaign = await db.campaign.findUniqueOrThrow({ where: { id: campaignId } });

  const [
    npcs,
    locations,
    factions,
    lorePages,
    ideas,
    tags,
    npcTags,
    locationTags,
    factionTags,
    lorePageTags,
    ideaTags,
    relationships,
    sessionPlans,
    checklistItems,
    scenes,
    quests,
    questTags,
    plotThreads,
    plotThreadTags,
    consequences,
    consequenceTags,
    sessionLogEntries,
    combatEncounters,
    combatants,
    audioTracks,
    timelineEvents,
    timelineEventTags,
    campaignCalendar,
    narrativeClocks,
    familyRelations,
    mysteries,
    mysteryTags,
    clues,
    monsters,
    monsterAttributes,
    monsterTags,
    items,
    itemTags,
    powers,
    powerTags,
    rollTables,
    rollTableEntries,
    handouts,
    campaignModuleSettings,
    characters,
    customCategories,
    customCategoryEntries,
  ] = await Promise.all([
    db.npc.findMany({ where: { campaignId } }),
    db.location.findMany({ where: { campaignId } }),
    db.faction.findMany({ where: { campaignId } }),
    db.lorePage.findMany({ where: { campaignId } }),
    db.idea.findMany({ where: { campaignId } }),
    db.tag.findMany({ where: { campaignId } }),
    db.npcTag.findMany({ where: { tag: { campaignId } } }),
    db.locationTag.findMany({ where: { tag: { campaignId } } }),
    db.factionTag.findMany({ where: { tag: { campaignId } } }),
    db.lorePageTag.findMany({ where: { tag: { campaignId } } }),
    db.ideaTag.findMany({ where: { tag: { campaignId } } }),
    db.relationship.findMany({ where: { campaignId } }),
    db.sessionPlan.findMany({ where: { campaignId } }),
    db.checklistItem.findMany({ where: { sessionPlan: { campaignId } } }),
    db.scene.findMany({ where: { campaignId } }),
    db.quest.findMany({ where: { campaignId } }),
    db.questTag.findMany({ where: { tag: { campaignId } } }),
    db.plotThread.findMany({ where: { campaignId } }),
    db.plotThreadTag.findMany({ where: { tag: { campaignId } } }),
    db.consequence.findMany({ where: { campaignId } }),
    db.consequenceTag.findMany({ where: { tag: { campaignId } } }),
    db.sessionLogEntry.findMany({ where: { campaignId } }),
    db.combatEncounter.findMany({ where: { campaignId } }),
    db.combatant.findMany({ where: { encounter: { campaignId } } }),
    db.audioTrack.findMany({ where: { campaignId } }),
    db.timelineEvent.findMany({ where: { campaignId } }),
    db.timelineEventTag.findMany({ where: { tag: { campaignId } } }),
    db.campaignCalendar.findUnique({ where: { campaignId } }),
    db.narrativeClock.findMany({ where: { campaignId } }),
    db.familyRelation.findMany({ where: { campaignId } }),
    db.mystery.findMany({ where: { campaignId } }),
    db.mysteryTag.findMany({ where: { tag: { campaignId } } }),
    db.clue.findMany({ where: { mystery: { campaignId } } }),
    db.monster.findMany({ where: { campaignId } }),
    db.monsterAttribute.findMany({ where: { monster: { campaignId } } }),
    db.monsterTag.findMany({ where: { tag: { campaignId } } }),
    db.item.findMany({ where: { campaignId } }),
    db.itemTag.findMany({ where: { tag: { campaignId } } }),
    db.power.findMany({ where: { campaignId } }),
    db.powerTag.findMany({ where: { tag: { campaignId } } }),
    db.rollTable.findMany({ where: { campaignId } }),
    db.rollTableEntry.findMany({ where: { table: { campaignId } } }),
    db.handout.findMany({ where: { campaignId } }),
    db.campaignModuleSetting.findMany({ where: { campaignId } }),
    db.character.findMany({ where: { campaignId } }),
    db.customCategory.findMany({ where: { campaignId } }),
    db.customCategoryEntry.findMany({ where: { category: { campaignId } } }),
  ]);

  const data: CampaignExportData = {
    npcs: serializeAll(npcs) as unknown as CampaignExportData["npcs"],
    locations: serializeAll(locations) as unknown as CampaignExportData["locations"],
    factions: serializeAll(factions) as unknown as CampaignExportData["factions"],
    lorePages: serializeAll(lorePages) as unknown as CampaignExportData["lorePages"],
    ideas: serializeAll(ideas) as unknown as CampaignExportData["ideas"],
    tags: serializeAll(tags) as unknown as CampaignExportData["tags"],
    npcTags: npcTags as CampaignExportData["npcTags"],
    locationTags: locationTags as CampaignExportData["locationTags"],
    factionTags: factionTags as CampaignExportData["factionTags"],
    lorePageTags: lorePageTags as CampaignExportData["lorePageTags"],
    ideaTags: ideaTags as CampaignExportData["ideaTags"],
    relationships: serializeAll(relationships) as unknown as CampaignExportData["relationships"],
    sessionPlans: serializeAll(sessionPlans) as unknown as CampaignExportData["sessionPlans"],
    checklistItems: serializeAll(checklistItems) as unknown as CampaignExportData["checklistItems"],
    scenes: serializeAll(scenes) as unknown as CampaignExportData["scenes"],
    quests: serializeAll(quests) as unknown as CampaignExportData["quests"],
    questTags: questTags as CampaignExportData["questTags"],
    plotThreads: serializeAll(plotThreads) as unknown as CampaignExportData["plotThreads"],
    plotThreadTags: plotThreadTags as CampaignExportData["plotThreadTags"],
    consequences: serializeAll(consequences) as unknown as CampaignExportData["consequences"],
    consequenceTags: consequenceTags as CampaignExportData["consequenceTags"],
    sessionLogEntries: serializeAll(sessionLogEntries) as unknown as CampaignExportData["sessionLogEntries"],
    combatEncounters: serializeAll(combatEncounters) as unknown as CampaignExportData["combatEncounters"],
    combatants: serializeAll(combatants) as unknown as CampaignExportData["combatants"],
    audioTracks: serializeAll(audioTracks) as unknown as CampaignExportData["audioTracks"],
    timelineEvents: serializeAll(timelineEvents) as unknown as CampaignExportData["timelineEvents"],
    timelineEventTags: timelineEventTags as CampaignExportData["timelineEventTags"],
    campaignCalendars: campaignCalendar
      ? ([serializeRow(campaignCalendar)] as unknown as CampaignExportData["campaignCalendars"])
      : [],
    narrativeClocks: serializeAll(narrativeClocks) as unknown as CampaignExportData["narrativeClocks"],
    familyRelations: serializeAll(familyRelations) as unknown as CampaignExportData["familyRelations"],
    mysteries: serializeAll(mysteries) as unknown as CampaignExportData["mysteries"],
    mysteryTags: mysteryTags as CampaignExportData["mysteryTags"],
    clues: serializeAll(clues) as unknown as CampaignExportData["clues"],
    monsters: serializeAll(monsters) as unknown as CampaignExportData["monsters"],
    monsterAttributes: monsterAttributes as CampaignExportData["monsterAttributes"],
    monsterTags: monsterTags as CampaignExportData["monsterTags"],
    items: serializeAll(items) as unknown as CampaignExportData["items"],
    itemTags: itemTags as CampaignExportData["itemTags"],
    powers: serializeAll(powers) as unknown as CampaignExportData["powers"],
    powerTags: powerTags as CampaignExportData["powerTags"],
    rollTables: serializeAll(rollTables) as unknown as CampaignExportData["rollTables"],
    rollTableEntries: serializeAll(rollTableEntries) as unknown as CampaignExportData["rollTableEntries"],
    handouts: serializeAll(handouts) as unknown as CampaignExportData["handouts"],
    campaignModuleSettings: serializeAll(campaignModuleSettings) as unknown as CampaignExportData["campaignModuleSettings"],
    characters: serializeAll(characters) as unknown as CampaignExportData["characters"],
    customCategories: serializeAll(customCategories) as unknown as CampaignExportData["customCategories"],
    customCategoryEntries: serializeAll(customCategoryEntries) as unknown as CampaignExportData["customCategoryEntries"],
  };

  return {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    hub: { name: "RPG Master Hub" },
    campaign: {
      name: campaign.name,
      description: campaign.description,
      imageUrl: campaign.imageUrl,
      bannerUrl: campaign.bannerUrl,
      iconUrl: campaign.iconUrl,
      symbolUrl: campaign.symbolUrl,
      backgroundUrl: campaign.backgroundUrl,
      primaryColor: campaign.primaryColor,
      secondaryColor: campaign.secondaryColor,
      status: campaign.status,
      archivedAt: campaign.archivedAt?.toISOString() ?? null,
      lastSessionAt: campaign.lastSessionAt?.toISOString() ?? null,
      nextSessionAt: campaign.nextSessionAt?.toISOString() ?? null,
    },
    data,
  };
}

/** Contagem de linhas por modelo, na mesma ordem de `EXPORT_DATA_LABELS` — usado no LEIA-ME.txt do zip e no resumo pós-import. */
export function summarizeExportCounts(doc: CampaignExportV1): Array<{ key: keyof CampaignExportData; label: string; count: number }> {
  return (Object.keys(EXPORT_DATA_LABELS) as Array<keyof CampaignExportData>).map((key) => ({
    key,
    label: EXPORT_DATA_LABELS[key],
    count: doc.data[key].length,
  }));
}
