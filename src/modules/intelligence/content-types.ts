import { CalendarCheck, Clock, Dices, Gem, Lightbulb, type LucideIcon } from "lucide-react";

import type { RelatableEntityType } from "@/generated/prisma/client";
import {
  ENTITY_TYPE_ICONS,
  ENTITY_TYPE_LABELS,
  ENTITY_TYPE_LABELS_PLURAL,
  ENTITY_TYPE_PATH,
} from "@/modules/creation/relationships/config";

/**
 * Universo COMPLETO de tipos de conteúdo da campanha, para as features de
 * Fase 7 que precisam enxergar tudo (Campaign Brain, Campaign Health, Content
 * Graveyard) — mais amplo que `RelatableEntityType` (12 tipos, usado pelo
 * Context Engine e pelo sistema de Relacionamentos), porque inclui também
 * Ideias, Relógios Narrativos, Tabelas de Rolagem e Sessões: conteúdo real da
 * campanha que só não participa de Relacionamentos (ver ARCHITECTURE.md,
 * seções 12.1/16.2/17.3, para o porquê de cada um ter ficado de fora de lá).
 * `RollTable` vira dois tipos aqui (`ROLL_TABLE_GENERIC`/`ROLL_TABLE_LOOT`)
 * porque Table Builder e Loot Generator, embora sejam o mesmo modelo
 * (`RollTable.kind`), são duas rotas/listas distintas na UI (seção 17.3) — a
 * ação de arquivar/excluir também exige o `kind` como parâmetro.
 */
export type ContentEntityType = RelatableEntityType | "IDEA" | "NARRATIVE_CLOCK" | "ROLL_TABLE_GENERIC" | "ROLL_TABLE_LOOT" | "SESSION_PLAN";

export const CONTENT_TYPE_LABELS: Record<ContentEntityType, string> = {
  ...ENTITY_TYPE_LABELS,
  IDEA: "Ideia",
  NARRATIVE_CLOCK: "Relógio Narrativo",
  ROLL_TABLE_GENERIC: "Tabela de Rolagem",
  ROLL_TABLE_LOOT: "Item de Loot",
  SESSION_PLAN: "Sessão",
};

export const CONTENT_TYPE_LABELS_PLURAL: Record<ContentEntityType, string> = {
  ...ENTITY_TYPE_LABELS_PLURAL,
  IDEA: "Ideias",
  NARRATIVE_CLOCK: "Relógios Narrativos",
  ROLL_TABLE_GENERIC: "Tabelas de Rolagem",
  ROLL_TABLE_LOOT: "Tabelas de Loot",
  SESSION_PLAN: "Sessões",
};

export const CONTENT_TYPE_ICONS: Record<ContentEntityType, LucideIcon> = {
  ...ENTITY_TYPE_ICONS,
  IDEA: Lightbulb,
  NARRATIVE_CLOCK: Clock,
  ROLL_TABLE_GENERIC: Dices,
  ROLL_TABLE_LOOT: Gem,
  SESSION_PLAN: CalendarCheck,
};

const CONTENT_TYPE_PATH: Record<ContentEntityType, string> = {
  ...ENTITY_TYPE_PATH,
  IDEA: "ideas",
  NARRATIVE_CLOCK: "clocks",
  ROLL_TABLE_GENERIC: "tables",
  ROLL_TABLE_LOOT: "loot",
  SESSION_PLAN: "session-plans",
};

/** Ideias e Relógios Narrativos não têm página de detalhe própria — o link cai na lista (mesmo critério da seção 13.1). */
const TYPES_WITHOUT_DETAIL_PAGE = new Set<ContentEntityType>(["IDEA", "NARRATIVE_CLOCK"]);

export function getContentEntityHref(campaignId: string, type: ContentEntityType, id: string): string {
  const base = `/campaigns/${campaignId}/${CONTENT_TYPE_PATH[type]}`;
  return TYPES_WITHOUT_DETAIL_PAGE.has(type) ? base : `${base}/${id}`;
}

/** Os 7 tipos que têm `canonStatus` (o eixo narrativo — ver ARCHITECTURE.md, seção 12.2). */
export const CANON_STATUS_ENTITY_TYPES = ["NPC", "LOCATION", "FACTION", "LORE_PAGE", "MONSTER", "ITEM", "POWER"] as const;

/** Os 12 tipos que participam do sistema de Relacionamentos (== `RelatableEntityType`). */
export const RELATABLE_ENTITY_TYPES: RelatableEntityType[] = Object.keys(ENTITY_TYPE_LABELS) as RelatableEntityType[];

/** Todos os 17 tipos que têm o campo `archived` — o universo do Content Graveyard. */
export const ARCHIVABLE_ENTITY_TYPES: ContentEntityType[] = Object.keys(CONTENT_TYPE_LABELS) as ContentEntityType[];
