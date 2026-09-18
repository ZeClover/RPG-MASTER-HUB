import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { buildCampaignExport } from "@/modules/core/campaigns/export/export";
import { importCampaignExport, type ImportSummary } from "@/modules/core/campaigns/export/import";
import { EXPORT_DATA_LABELS, type CampaignExportData } from "@/modules/core/campaigns/export/schemas";

/**
 * Fase 12, Part 3 — teste de integração de round-trip contra o Postgres real
 * (mesmo `DATABASE_URL` de `.env` usado no resto do desenvolvimento manual
 * deste projeto). Este é o portão de correção de verdade do export/import:
 * ele semeia uma campanha com pelo menos um exemplar de cada caso difícil
 * (hierarquia de Location, Tag em duas entidades diferentes, Relationship
 * entre dois NPCs, Clue com `linkedEntityId` polimórfico, Character cujo
 * `playerId` precisa ser reatribuído) e verifica que tudo sobrevive ao
 * ciclo export→import com IDs NOVOS e sem contaminar a campanha original.
 */
describe("round-trip de export/import de campanha", () => {
  let ownerId: string;
  let originalPlayerId: string;
  let importerId: string;
  let campaignId: string;
  let npcGmOnlyId: string;
  let npcPlayersId: string;
  let parentLocationId: string;
  let childLocationId: string;

  let importedCampaignId: string;
  let importSummary: ImportSummary;

  beforeAll(async () => {
    const suffix = randomUUID().slice(0, 8);
    const owner = await db.user.create({ data: { name: "Dono Original", email: `rt-owner-${suffix}@test.local` } });
    const originalPlayer = await db.user.create({
      data: { name: "Jogador Original", email: `rt-player-${suffix}@test.local` },
    });
    const importer = await db.user.create({ data: { name: "Quem Importa", email: `rt-importer-${suffix}@test.local` } });
    ownerId = owner.id;
    originalPlayerId = originalPlayer.id;
    importerId = importer.id;

    const campaign = await db.campaign.create({
      data: {
        name: "Campanha de teste — round trip",
        ownerId,
        members: {
          create: [
            { userId: ownerId, role: "OWNER" },
            { userId: originalPlayerId, role: "PLAYER" },
          ],
        },
      },
    });
    campaignId = campaign.id;

    const npcGmOnly = await db.npc.create({
      data: { campaignId, name: "Vilão Secreto", visibility: "GM_ONLY", secrets: "É o irmão perdido do rei" },
    });
    const npcPlayers = await db.npc.create({
      data: { campaignId, name: "Taverneiro Gentil", visibility: "PLAYERS" },
    });
    npcGmOnlyId = npcGmOnly.id;
    npcPlayersId = npcPlayers.id;

    const parentLocation = await db.location.create({ data: { campaignId, name: "Reino de Aldenor" } });
    const childLocation = await db.location.create({
      data: { campaignId, name: "Vila de Pedrafria", parentLocationId: parentLocation.id },
    });
    parentLocationId = parentLocation.id;
    childLocationId = childLocation.id;

    const tag = await db.tag.create({ data: { campaignId, name: "Importante", slug: "importante" } });
    await db.npcTag.create({ data: { npcId: npcGmOnlyId, tagId: tag.id } });
    await db.locationTag.create({ data: { locationId: parentLocationId, tagId: tag.id } });

    await db.relationship.create({
      data: {
        campaignId,
        sourceType: "NPC",
        sourceId: npcGmOnlyId,
        targetType: "NPC",
        targetId: npcPlayersId,
        type: "inimigo de",
        description: "O vilão ameaça o taverneiro",
      },
    });

    const mystery = await db.mystery.create({ data: { campaignId, title: "Quem matou o mercador?" } });
    await db.clue.create({
      data: {
        mysteryId: mystery.id,
        text: "Uma carta selada com o brasão do vilão",
        linkedEntityType: "NPC",
        linkedEntityId: npcGmOnlyId,
      },
    });

    const sessionPlan = await db.sessionPlan.create({ data: { campaignId, title: "Sessão 1 — Chegada" } });
    await db.scene.create({ data: { campaignId, sessionPlanId: sessionPlan.id, title: "Chegada na vila" } });
    await db.checklistItem.create({ data: { sessionPlanId: sessionPlan.id, label: "Preparar o mapa da vila" } });

    await db.character.create({
      data: { campaignId, playerId: originalPlayerId, name: "Elira, a Arqueira", concept: "Batedora élfica" },
    });

    const customCategory = await db.customCategory.create({ data: { campaignId, name: "Matéria escolar" } });
    await db.customCategoryEntry.create({ data: { categoryId: customCategory.id, title: "Alquimia básica" } });

    const rollTable = await db.rollTable.create({ data: { campaignId, name: "Encontros na estrada" } });
    await db.rollTableEntry.create({ data: { tableId: rollTable.id, label: "Alcateia de lobos", weight: 2 } });
    await db.rollTableEntry.create({ data: { tableId: rollTable.id, label: "Caravana de mercadores", weight: 1 } });

    const doc = await buildCampaignExport(campaignId);
    const result = await importCampaignExport(importerId, doc);
    importedCampaignId = result.campaignId;
    importSummary = result.summary;
  });

  afterAll(async () => {
    await db.campaign.deleteMany({ where: { id: { in: [campaignId, importedCampaignId].filter(Boolean) } } });
    await db.user.deleteMany({ where: { id: { in: [ownerId, originalPlayerId, importerId].filter(Boolean) } } });
  });

  it("cria uma campanha nova, distinta da original", () => {
    expect(importedCampaignId).toBeTruthy();
    expect(importedCampaignId).not.toBe(campaignId);
  });

  it("preserva a contagem de linhas por modelo entre a campanha original e a importada", async () => {
    const [originalDoc, importedDoc] = await Promise.all([
      buildCampaignExport(campaignId),
      buildCampaignExport(importedCampaignId),
    ]);

    for (const key of Object.keys(EXPORT_DATA_LABELS) as Array<keyof CampaignExportData>) {
      expect(importedDoc.data[key].length, `contagem de ${key}`).toBe(originalDoc.data[key].length);
    }

    // Pelo menos os modelos semeados neste teste realmente têm > 0 linhas —
    // uma contagem "0 == 0" não provaria nada.
    expect(originalDoc.data.npcs.length).toBe(2);
    expect(originalDoc.data.locations.length).toBe(2);
    expect(originalDoc.data.tags.length).toBe(1);
    expect(originalDoc.data.npcTags.length).toBe(1);
    expect(originalDoc.data.locationTags.length).toBe(1);
    expect(originalDoc.data.relationships.length).toBe(1);
    expect(originalDoc.data.mysteries.length).toBe(1);
    expect(originalDoc.data.clues.length).toBe(1);
    expect(originalDoc.data.sessionPlans.length).toBe(1);
    expect(originalDoc.data.scenes.length).toBe(1);
    expect(originalDoc.data.checklistItems.length).toBe(1);
    expect(originalDoc.data.characters.length).toBe(1);
    expect(originalDoc.data.customCategories.length).toBe(1);
    expect(originalDoc.data.customCategoryEntries.length).toBe(1);
    expect(originalDoc.data.rollTables.length).toBe(1);
    expect(originalDoc.data.rollTableEntries.length).toBe(2);
  });

  it("mantém os valores escalares das linhas, mas com ids diferentes", async () => {
    const importedNpcGmOnly = await db.npc.findFirst({ where: { campaignId: importedCampaignId, name: "Vilão Secreto" } });
    expect(importedNpcGmOnly).not.toBeNull();
    expect(importedNpcGmOnly!.id).not.toBe(npcGmOnlyId);
    expect(importedNpcGmOnly!.visibility).toBe("GM_ONLY");
    expect(importedNpcGmOnly!.secrets).toBe("É o irmão perdido do rei");

    const importedNpcPlayers = await db.npc.findFirst({
      where: { campaignId: importedCampaignId, name: "Taverneiro Gentil" },
    });
    expect(importedNpcPlayers).not.toBeNull();
    expect(importedNpcPlayers!.id).not.toBe(npcPlayersId);
    expect(importedNpcPlayers!.visibility).toBe("PLAYERS");
  });

  it("preserva a hierarquia de Location com os ids remapeados (não os antigos, não null)", async () => {
    const importedParent = await db.location.findFirst({
      where: { campaignId: importedCampaignId, name: "Reino de Aldenor" },
    });
    const importedChild = await db.location.findFirst({
      where: { campaignId: importedCampaignId, name: "Vila de Pedrafria" },
    });

    expect(importedParent).not.toBeNull();
    expect(importedChild).not.toBeNull();
    expect(importedParent!.id).not.toBe(parentLocationId);
    expect(importedChild!.id).not.toBe(childLocationId);

    expect(importedChild!.parentLocationId).not.toBeNull();
    expect(importedChild!.parentLocationId).not.toBe(parentLocationId); // não é o id antigo
    expect(importedChild!.parentLocationId).toBe(importedParent!.id); // é o novo id do pai
  });

  it("preserva os vínculos de Tag (NPC e Location continuam marcados, não órfãos)", async () => {
    const importedTag = await db.tag.findFirst({ where: { campaignId: importedCampaignId, name: "Importante" } });
    expect(importedTag).not.toBeNull();

    const importedNpcGmOnly = await db.npc.findFirst({ where: { campaignId: importedCampaignId, name: "Vilão Secreto" } });
    const importedParent = await db.location.findFirst({
      where: { campaignId: importedCampaignId, name: "Reino de Aldenor" },
    });

    const npcTag = await db.npcTag.findUnique({
      where: { npcId_tagId: { npcId: importedNpcGmOnly!.id, tagId: importedTag!.id } },
    });
    const locationTag = await db.locationTag.findUnique({
      where: { locationId_tagId: { locationId: importedParent!.id, tagId: importedTag!.id } },
    });

    expect(npcTag).not.toBeNull();
    expect(locationTag).not.toBeNull();
  });

  it("remapeia o Relationship entre os dois NPCs para os ids novos", async () => {
    const importedNpcGmOnly = await db.npc.findFirst({ where: { campaignId: importedCampaignId, name: "Vilão Secreto" } });
    const importedNpcPlayers = await db.npc.findFirst({
      where: { campaignId: importedCampaignId, name: "Taverneiro Gentil" },
    });

    const relationship = await db.relationship.findFirst({ where: { campaignId: importedCampaignId } });
    expect(relationship).not.toBeNull();
    expect(relationship!.sourceType).toBe("NPC");
    expect(relationship!.targetType).toBe("NPC");
    expect(relationship!.sourceId).toBe(importedNpcGmOnly!.id);
    expect(relationship!.targetId).toBe(importedNpcPlayers!.id);
    expect(relationship!.sourceId).not.toBe(npcGmOnlyId);
    expect(relationship!.targetId).not.toBe(npcPlayersId);
  });

  it("remapeia o linkedEntityId polimórfico da Clue para o novo id do NPC", async () => {
    const importedMystery = await db.mystery.findFirst({
      where: { campaignId: importedCampaignId, title: "Quem matou o mercador?" },
    });
    const importedNpcGmOnly = await db.npc.findFirst({ where: { campaignId: importedCampaignId, name: "Vilão Secreto" } });

    const clue = await db.clue.findFirst({ where: { mysteryId: importedMystery!.id } });
    expect(clue).not.toBeNull();
    expect(clue!.linkedEntityType).toBe("NPC");
    expect(clue!.linkedEntityId).toBe(importedNpcGmOnly!.id);
    expect(clue!.linkedEntityId).not.toBe(npcGmOnlyId);
  });

  it("reatribui o Character importado para quem importou, não para o dono original", async () => {
    const character = await db.character.findFirst({ where: { campaignId: importedCampaignId, name: "Elira, a Arqueira" } });
    expect(character).not.toBeNull();
    expect(character!.playerId).toBe(importerId);
    expect(character!.playerId).not.toBe(originalPlayerId);

    expect(importSummary.counts.characters).toBe(1);
    expect(importSummary.warnings.some((warning) => warning.includes("1 personagem"))).toBe(true);
  });

  it("a campanha nova tem exatamente um CampaignMember: quem importou, como OWNER", async () => {
    const members = await db.campaignMember.findMany({ where: { campaignId: importedCampaignId } });
    expect(members).toHaveLength(1);
    expect(members[0].userId).toBe(importerId);
    expect(members[0].role).toBe("OWNER");
  });
});
