import { z } from "zod";

/**
 * Fase 12 — Segurança dos dados: contrato do arquivo de export/backup de uma
 * campanha. Este arquivo é a ÚNICA fonte de verdade do formato — `export.ts`
 * (Part 1, produz) e `import.ts`/`actions.ts` (Part 2, consomem e validam)
 * importam os tipos e o schema Zod daqui, nunca redeclaram o shape.
 *
 * Datas são sempre `string` (ISO 8601, `Date.toISOString()`), nunca `Date`:
 * o documento que `buildCampaignExport` devolve já é exatamente o JSON que
 * vai para o arquivo (ver `export.ts`), então o contrato é o shape pós-
 * serialização dos dois lados (export escreve, import lê de volta).
 *
 * Os valores de enum abaixo espelham `prisma/schema.prisma` como literais de
 * string (não importamos o client gerado do Prisma aqui) — este módulo é o
 * "contrato de arquivo", deliberadamente desacoplado de `@/generated/prisma`.
 */

const CANON_STATUS = ["DRAFT", "PROPOSED", "APPROVED", "CANON", "OBSOLETE", "ARCHIVED"] as const;
const VISIBILITY = ["GM_ONLY", "PLAYERS", "PUBLIC"] as const;
const IDEA_STATE = ["NEW", "INTERESTING", "DEVELOPING", "USED", "ARCHIVED", "DISCARDED"] as const;
const RELATABLE_ENTITY_TYPE = [
  "NPC",
  "LOCATION",
  "FACTION",
  "LORE_PAGE",
  "QUEST",
  "PLOT_THREAD",
  "CONSEQUENCE",
  "TIMELINE_EVENT",
  "MYSTERY",
  "MONSTER",
  "ITEM",
  "POWER",
] as const;
export type RelatableEntityTypeExport = (typeof RELATABLE_ENTITY_TYPE)[number];

const RELATIONSHIP_IMPORTANCE = ["LOW", "MEDIUM", "HIGH"] as const;
const SESSION_PLAN_STATUS = ["PLANNING", "READY", "DONE", "CANCELLED"] as const;
const SCENE_STATUS = ["PLANNED", "PLAYED", "CUT"] as const;
const QUEST_STATUS = ["NOT_STARTED", "ACTIVE", "COMPLETED", "FAILED", "ABANDONED"] as const;
const PLOT_THREAD_STATUS = ["ACTIVE", "DORMANT", "RESOLVED", "ABANDONED"] as const;
const CONSEQUENCE_STATUS = ["PENDING", "TRIGGERED", "RESOLVED"] as const;
const SESSION_LOG_ENTRY_TYPE = ["NOTE", "DICE_ROLL", "COMBAT_EVENT"] as const;
const COMBATANT_TYPE = ["PC", "NPC"] as const;
const AUDIO_TRACK_CATEGORY = ["MUSIC", "SFX"] as const;
const MYSTERY_STATUS = ["OPEN", "RESOLVED"] as const;
const FAMILY_RELATION_TYPE = ["PARENT_OF", "SPOUSE_OF", "SIBLING_OF"] as const;
const ROLL_TABLE_KIND = ["GENERIC", "LOOT"] as const;
const CAMPAIGN_STATUS = ["ACTIVE", "ARCHIVED"] as const;

const id = z.string().min(1);
const isoDate = z.string().min(1);
const text = z.string().nullable();

// ── Campanha (metadados do topo do documento) ──────────────────────────────

export const campaignExportMetaSchema = z.object({
  name: z.string(),
  description: text,
  imageUrl: text,
  bannerUrl: text,
  iconUrl: text,
  symbolUrl: text,
  backgroundUrl: text,
  primaryColor: text,
  secondaryColor: text,
  status: z.enum(CAMPAIGN_STATUS),
  archivedAt: isoDate.nullable(),
  lastSessionAt: isoDate.nullable(),
  nextSessionAt: isoDate.nullable(),
});
export type CampaignExportMeta = z.infer<typeof campaignExportMetaSchema>;

// ── Fase 1 — Wiki ───────────────────────────────────────────────────────────

export const npcExportSchema = z.object({
  id,
  name: z.string(),
  imageUrl: text,
  age: text,
  species: text,
  gender: text,
  appearance: text,
  personality: text,
  history: text,
  goals: text,
  fears: text,
  secrets: text,
  narrativeStatus: text,
  gmNotes: text,
  canonStatus: z.enum(CANON_STATUS),
  visibility: z.enum(VISIBILITY),
  favorite: z.boolean(),
  archived: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type NpcExport = z.infer<typeof npcExportSchema>;

export const locationExportSchema = z.object({
  id,
  name: z.string(),
  imageUrl: text,
  description: text,
  locationType: text,
  notes: text,
  parentLocationId: z.string().nullable(),
  canonStatus: z.enum(CANON_STATUS),
  visibility: z.enum(VISIBILITY),
  favorite: z.boolean(),
  archived: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type LocationExport = z.infer<typeof locationExportSchema>;

export const factionExportSchema = z.object({
  id,
  name: z.string(),
  imageUrl: text,
  factionType: text,
  description: text,
  history: text,
  goals: text,
  resources: text,
  secrets: text,
  notes: text,
  canonStatus: z.enum(CANON_STATUS),
  visibility: z.enum(VISIBILITY),
  favorite: z.boolean(),
  archived: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type FactionExport = z.infer<typeof factionExportSchema>;

export const lorePageExportSchema = z.object({
  id,
  title: z.string(),
  content: text,
  imageUrl: text,
  category: text,
  canonStatus: z.enum(CANON_STATUS),
  visibility: z.enum(VISIBILITY),
  favorite: z.boolean(),
  archived: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type LorePageExport = z.infer<typeof lorePageExportSchema>;

export const ideaExportSchema = z.object({
  id,
  title: z.string(),
  content: text,
  state: z.enum(IDEA_STATE),
  favorite: z.boolean(),
  archived: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type IdeaExport = z.infer<typeof ideaExportSchema>;

export const tagExportSchema = z.object({
  id,
  name: z.string(),
  slug: z.string(),
  color: text,
  createdAt: isoDate,
});
export type TagExport = z.infer<typeof tagExportSchema>;

const npcTagExportSchema = z.object({ npcId: id, tagId: id });
const locationTagExportSchema = z.object({ locationId: id, tagId: id });
const factionTagExportSchema = z.object({ factionId: id, tagId: id });
const lorePageTagExportSchema = z.object({ lorePageId: id, tagId: id });
const ideaTagExportSchema = z.object({ ideaId: id, tagId: id });
export type NpcTagExport = z.infer<typeof npcTagExportSchema>;
export type LocationTagExport = z.infer<typeof locationTagExportSchema>;
export type FactionTagExport = z.infer<typeof factionTagExportSchema>;
export type LorePageTagExport = z.infer<typeof lorePageTagExportSchema>;
export type IdeaTagExport = z.infer<typeof ideaTagExportSchema>;

export const relationshipExportSchema = z.object({
  id,
  sourceType: z.enum(RELATABLE_ENTITY_TYPE),
  sourceId: z.string(),
  targetType: z.enum(RELATABLE_ENTITY_TYPE),
  targetId: z.string(),
  type: z.string(),
  description: text,
  importance: z.enum(RELATIONSHIP_IMPORTANCE).nullable(),
  visibility: z.enum(VISIBILITY),
  createdAt: isoDate,
});
export type RelationshipExport = z.infer<typeof relationshipExportSchema>;

// ── Fase 2 — Preparação ──────────────────────────────────────────────────────

export const sessionPlanExportSchema = z.object({
  id,
  title: z.string(),
  sessionNumber: z.number().int().nullable(),
  plannedDate: isoDate.nullable(),
  pitch: text,
  gmNotes: text,
  status: z.enum(SESSION_PLAN_STATUS),
  favorite: z.boolean(),
  archived: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type SessionPlanExport = z.infer<typeof sessionPlanExportSchema>;

export const checklistItemExportSchema = z.object({
  id,
  sessionPlanId: id,
  label: z.string(),
  done: z.boolean(),
  order: z.number().int(),
  createdAt: isoDate,
});
export type ChecklistItemExport = z.infer<typeof checklistItemExportSchema>;

export const sceneExportSchema = z.object({
  id,
  sessionPlanId: id,
  title: z.string(),
  summary: text,
  readAloud: text,
  goal: text,
  order: z.number().int(),
  status: z.enum(SCENE_STATUS),
  favorite: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type SceneExport = z.infer<typeof sceneExportSchema>;

export const questExportSchema = z.object({
  id,
  title: z.string(),
  description: text,
  objective: text,
  reward: text,
  status: z.enum(QUEST_STATUS),
  visibility: z.enum(VISIBILITY),
  favorite: z.boolean(),
  archived: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type QuestExport = z.infer<typeof questExportSchema>;

const questTagExportSchema = z.object({ questId: id, tagId: id });
export type QuestTagExport = z.infer<typeof questTagExportSchema>;

export const plotThreadExportSchema = z.object({
  id,
  title: z.string(),
  description: text,
  status: z.enum(PLOT_THREAD_STATUS),
  importance: z.enum(RELATIONSHIP_IMPORTANCE),
  visibility: z.enum(VISIBILITY),
  favorite: z.boolean(),
  archived: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type PlotThreadExport = z.infer<typeof plotThreadExportSchema>;

const plotThreadTagExportSchema = z.object({ plotThreadId: id, tagId: id });
export type PlotThreadTagExport = z.infer<typeof plotThreadTagExportSchema>;

export const consequenceExportSchema = z.object({
  id,
  title: z.string(),
  trigger: text,
  description: text,
  status: z.enum(CONSEQUENCE_STATUS),
  visibility: z.enum(VISIBILITY),
  favorite: z.boolean(),
  archived: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type ConsequenceExport = z.infer<typeof consequenceExportSchema>;

const consequenceTagExportSchema = z.object({ consequenceId: id, tagId: id });
export type ConsequenceTagExport = z.infer<typeof consequenceTagExportSchema>;

// ── Fase 3 — Modo Sessão ────────────────────────────────────────────────────

export const sessionLogEntryExportSchema = z.object({
  id,
  sessionPlanId: z.string().nullable(),
  type: z.enum(SESSION_LOG_ENTRY_TYPE),
  content: z.string(),
  clientId: z.string().nullable(),
  createdAt: isoDate,
});
export type SessionLogEntryExport = z.infer<typeof sessionLogEntryExportSchema>;

export const combatEncounterExportSchema = z.object({
  id,
  sessionPlanId: z.string().nullable(),
  name: z.string(),
  round: z.number().int(),
  activeCombatantId: z.string().nullable(),
  endedAt: isoDate.nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type CombatEncounterExport = z.infer<typeof combatEncounterExportSchema>;

export const combatantExportSchema = z.object({
  id,
  encounterId: id,
  name: z.string(),
  type: z.enum(COMBATANT_TYPE),
  initiative: z.number().int(),
  hpCurrent: z.number().int().nullable(),
  hpMax: z.number().int().nullable(),
  conditions: text,
  order: z.number().int(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type CombatantExport = z.infer<typeof combatantExportSchema>;

// ── Fase 4 — Áudio ───────────────────────────────────────────────────────────

export const audioTrackExportSchema = z.object({
  id,
  name: z.string(),
  category: z.enum(AUDIO_TRACK_CATEGORY),
  fileUrl: z.string(),
  loop: z.boolean(),
  createdAt: isoDate,
});
export type AudioTrackExport = z.infer<typeof audioTrackExportSchema>;

// ── Fase 5 — World Building ─────────────────────────────────────────────────

export const timelineEventExportSchema = z.object({
  id,
  title: z.string(),
  description: text,
  narrativeDate: text,
  order: z.number().int(),
  visibility: z.enum(VISIBILITY),
  favorite: z.boolean(),
  archived: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type TimelineEventExport = z.infer<typeof timelineEventExportSchema>;

const timelineEventTagExportSchema = z.object({ timelineEventId: id, tagId: id });
export type TimelineEventTagExport = z.infer<typeof timelineEventTagExportSchema>;

export const campaignCalendarExportSchema = z.object({
  id,
  currentDay: z.number().int(),
  dayLabel: z.string(),
  updatedAt: isoDate,
});
export type CampaignCalendarExport = z.infer<typeof campaignCalendarExportSchema>;

export const narrativeClockExportSchema = z.object({
  id,
  title: z.string(),
  description: text,
  segments: z.number().int(),
  filled: z.number().int(),
  favorite: z.boolean(),
  archived: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type NarrativeClockExport = z.infer<typeof narrativeClockExportSchema>;

export const familyRelationExportSchema = z.object({
  id,
  npcAId: id,
  npcBId: id,
  relationType: z.enum(FAMILY_RELATION_TYPE),
  notes: text,
  createdAt: isoDate,
});
export type FamilyRelationExport = z.infer<typeof familyRelationExportSchema>;

export const mysteryExportSchema = z.object({
  id,
  title: z.string(),
  description: text,
  status: z.enum(MYSTERY_STATUS),
  visibility: z.enum(VISIBILITY),
  favorite: z.boolean(),
  archived: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type MysteryExport = z.infer<typeof mysteryExportSchema>;

const mysteryTagExportSchema = z.object({ mysteryId: id, tagId: id });
export type MysteryTagExport = z.infer<typeof mysteryTagExportSchema>;

export const clueExportSchema = z.object({
  id,
  mysteryId: id,
  text: z.string(),
  discovered: z.boolean(),
  sharedWithPlayers: z.boolean(),
  order: z.number().int(),
  linkedEntityType: z.enum(RELATABLE_ENTITY_TYPE).nullable(),
  linkedEntityId: z.string().nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type ClueExport = z.infer<typeof clueExportSchema>;

// ── Fase 6 — Game Tools ──────────────────────────────────────────────────────

export const monsterExportSchema = z.object({
  id,
  name: z.string(),
  imageUrl: text,
  isBoss: z.boolean(),
  description: text,
  canonStatus: z.enum(CANON_STATUS),
  visibility: z.enum(VISIBILITY),
  favorite: z.boolean(),
  archived: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type MonsterExport = z.infer<typeof monsterExportSchema>;

export const monsterAttributeExportSchema = z.object({
  id,
  monsterId: id,
  key: z.string(),
  value: z.string(),
  order: z.number().int(),
});
export type MonsterAttributeExport = z.infer<typeof monsterAttributeExportSchema>;

const monsterTagExportSchema = z.object({ monsterId: id, tagId: id });
export type MonsterTagExport = z.infer<typeof monsterTagExportSchema>;

export const itemExportSchema = z.object({
  id,
  name: z.string(),
  imageUrl: text,
  category: text,
  description: text,
  effect: text,
  canonStatus: z.enum(CANON_STATUS),
  visibility: z.enum(VISIBILITY),
  favorite: z.boolean(),
  archived: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type ItemExport = z.infer<typeof itemExportSchema>;

const itemTagExportSchema = z.object({ itemId: id, tagId: id });
export type ItemTagExport = z.infer<typeof itemTagExportSchema>;

export const powerExportSchema = z.object({
  id,
  name: z.string(),
  cost: text,
  description: text,
  effect: text,
  canonStatus: z.enum(CANON_STATUS),
  visibility: z.enum(VISIBILITY),
  favorite: z.boolean(),
  archived: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type PowerExport = z.infer<typeof powerExportSchema>;

const powerTagExportSchema = z.object({ powerId: id, tagId: id });
export type PowerTagExport = z.infer<typeof powerTagExportSchema>;

export const rollTableExportSchema = z.object({
  id,
  name: z.string(),
  description: text,
  kind: z.enum(ROLL_TABLE_KIND),
  favorite: z.boolean(),
  archived: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type RollTableExport = z.infer<typeof rollTableExportSchema>;

export const rollTableEntryExportSchema = z.object({
  id,
  tableId: id,
  label: z.string(),
  weight: z.number().int(),
  order: z.number().int(),
  createdAt: isoDate,
});
export type RollTableEntryExport = z.infer<typeof rollTableEntryExportSchema>;

// ── Fase 9 — Jogadores ───────────────────────────────────────────────────────

export const handoutExportSchema = z.object({
  id,
  title: z.string(),
  content: text,
  imageUrl: text,
  revealed: z.boolean(),
  revealedAt: isoDate.nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type HandoutExport = z.infer<typeof handoutExportSchema>;

// ── Fase 10 — Módulos, Personagens, Categorias Personalizadas ───────────────

export const campaignModuleSettingExportSchema = z.object({
  id,
  moduleKey: z.string(),
  enabled: z.boolean(),
  updatedAt: isoDate,
});
export type CampaignModuleSettingExport = z.infer<typeof campaignModuleSettingExportSchema>;

export const characterExportSchema = z.object({
  id,
  playerId: id,
  name: z.string(),
  concept: text,
  imageUrl: text,
  bio: text,
  gmNotes: text,
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type CharacterExport = z.infer<typeof characterExportSchema>;

export const customCategoryExportSchema = z.object({
  id,
  name: z.string(),
  description: text,
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type CustomCategoryExport = z.infer<typeof customCategoryExportSchema>;

export const customCategoryEntryExportSchema = z.object({
  id,
  categoryId: id,
  title: z.string(),
  content: text,
  imageUrl: text,
  visibility: z.enum(VISIBILITY),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type CustomCategoryEntryExport = z.infer<typeof customCategoryEntryExportSchema>;

// ── Documento completo ───────────────────────────────────────────────────────

export const campaignExportDataSchema = z.object({
  npcs: z.array(npcExportSchema),
  locations: z.array(locationExportSchema),
  factions: z.array(factionExportSchema),
  lorePages: z.array(lorePageExportSchema),
  ideas: z.array(ideaExportSchema),
  tags: z.array(tagExportSchema),
  npcTags: z.array(npcTagExportSchema),
  locationTags: z.array(locationTagExportSchema),
  factionTags: z.array(factionTagExportSchema),
  lorePageTags: z.array(lorePageTagExportSchema),
  ideaTags: z.array(ideaTagExportSchema),
  relationships: z.array(relationshipExportSchema),
  sessionPlans: z.array(sessionPlanExportSchema),
  checklistItems: z.array(checklistItemExportSchema),
  scenes: z.array(sceneExportSchema),
  quests: z.array(questExportSchema),
  questTags: z.array(questTagExportSchema),
  plotThreads: z.array(plotThreadExportSchema),
  plotThreadTags: z.array(plotThreadTagExportSchema),
  consequences: z.array(consequenceExportSchema),
  consequenceTags: z.array(consequenceTagExportSchema),
  sessionLogEntries: z.array(sessionLogEntryExportSchema),
  combatEncounters: z.array(combatEncounterExportSchema),
  combatants: z.array(combatantExportSchema),
  audioTracks: z.array(audioTrackExportSchema),
  timelineEvents: z.array(timelineEventExportSchema),
  timelineEventTags: z.array(timelineEventTagExportSchema),
  campaignCalendars: z.array(campaignCalendarExportSchema),
  narrativeClocks: z.array(narrativeClockExportSchema),
  familyRelations: z.array(familyRelationExportSchema),
  mysteries: z.array(mysteryExportSchema),
  mysteryTags: z.array(mysteryTagExportSchema),
  clues: z.array(clueExportSchema),
  monsters: z.array(monsterExportSchema),
  monsterAttributes: z.array(monsterAttributeExportSchema),
  monsterTags: z.array(monsterTagExportSchema),
  items: z.array(itemExportSchema),
  itemTags: z.array(itemTagExportSchema),
  powers: z.array(powerExportSchema),
  powerTags: z.array(powerTagExportSchema),
  rollTables: z.array(rollTableExportSchema),
  rollTableEntries: z.array(rollTableEntryExportSchema),
  handouts: z.array(handoutExportSchema),
  campaignModuleSettings: z.array(campaignModuleSettingExportSchema),
  characters: z.array(characterExportSchema),
  customCategories: z.array(customCategoryExportSchema),
  customCategoryEntries: z.array(customCategoryEntryExportSchema),
});
export type CampaignExportData = z.infer<typeof campaignExportDataSchema>;

/**
 * Deliberadamente NÃO fazem parte do export (ver ARCHITECTURE.md, Fase 12):
 * - `CampaignMember` — memberships de outras pessoas não são deste exportador
 *   para redistribuir; reconvidar é passo manual na campanha nova após o import.
 * - `DiscordLink` — IDs reais de servidor/canal do Discord; recriar às cegas
 *   numa campanha importada poderia apontar um bot para o Discord de outra
 *   pessoa. Fica para quem importar reconfigurar manualmente.
 * - `MusicPlaybackState`, `SfxTriggerEvent` — estado de runtime transitório
 *   (o que está tocando agora / uma fila de disparo), sem sentido exportado.
 */
export const campaignExportSchema = z.object({
  formatVersion: z.literal(1),
  exportedAt: isoDate,
  hub: z.object({ name: z.literal("RPG Master Hub") }),
  campaign: campaignExportMetaSchema,
  data: campaignExportDataSchema,
});
export type CampaignExportV1 = z.infer<typeof campaignExportSchema>;

/** Chave usada nos textos humanos (LEIA-ME.txt, resumo de import) — mesma ordem do documento. */
export const EXPORT_DATA_LABELS: Record<keyof CampaignExportData, string> = {
  npcs: "NPCs",
  locations: "Locais",
  factions: "Facções",
  lorePages: "Páginas de Lore",
  ideas: "Ideias",
  tags: "Tags",
  npcTags: "Vínculos NPC↔Tag",
  locationTags: "Vínculos Local↔Tag",
  factionTags: "Vínculos Facção↔Tag",
  lorePageTags: "Vínculos Lore↔Tag",
  ideaTags: "Vínculos Ideia↔Tag",
  relationships: "Relacionamentos",
  sessionPlans: "Planos de Sessão",
  checklistItems: "Itens de checklist",
  scenes: "Cenas",
  quests: "Missões",
  questTags: "Vínculos Missão↔Tag",
  plotThreads: "Tramas",
  plotThreadTags: "Vínculos Trama↔Tag",
  consequences: "Consequências",
  consequenceTags: "Vínculos Consequência↔Tag",
  sessionLogEntries: "Registros de sessão",
  combatEncounters: "Encontros de combate",
  combatants: "Combatentes",
  audioTracks: "Faixas de áudio",
  timelineEvents: "Eventos da linha do tempo",
  timelineEventTags: "Vínculos Evento↔Tag",
  campaignCalendars: "Calendários",
  narrativeClocks: "Relógios narrativos",
  familyRelations: "Parentescos",
  mysteries: "Mistérios",
  mysteryTags: "Vínculos Mistério↔Tag",
  clues: "Pistas",
  monsters: "Monstros",
  monsterAttributes: "Atributos de monstro",
  monsterTags: "Vínculos Monstro↔Tag",
  items: "Itens",
  itemTags: "Vínculos Item↔Tag",
  powers: "Poderes",
  powerTags: "Vínculos Poder↔Tag",
  rollTables: "Tabelas de rolagem",
  rollTableEntries: "Entradas de tabela",
  handouts: "Handouts",
  campaignModuleSettings: "Configurações de módulo",
  characters: "Personagens",
  customCategories: "Categorias personalizadas",
  customCategoryEntries: "Entradas de categoria",
};
