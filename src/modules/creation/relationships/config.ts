import {
  BookOpen,
  History,
  Scroll,
  Search,
  ShieldAlert,
  MapPin,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { RelatableEntityType } from "@/generated/prisma/client";

export const ENTITY_TYPE_LABELS: Record<RelatableEntityType, string> = {
  NPC: "NPC",
  LOCATION: "Local",
  FACTION: "Facção",
  LORE_PAGE: "Lore",
  QUEST: "Missão",
  PLOT_THREAD: "Trama",
  CONSEQUENCE: "Consequência",
  TIMELINE_EVENT: "Evento",
  MYSTERY: "Mistério",
};

export const ENTITY_TYPE_LABELS_PLURAL: Record<RelatableEntityType, string> = {
  NPC: "NPCs",
  LOCATION: "Locais",
  FACTION: "Facções",
  LORE_PAGE: "Lore",
  QUEST: "Missões",
  PLOT_THREAD: "Tramas",
  CONSEQUENCE: "Consequências",
  TIMELINE_EVENT: "Eventos da linha do tempo",
  MYSTERY: "Mistérios",
};

export const ENTITY_TYPE_ICONS: Record<RelatableEntityType, LucideIcon> = {
  NPC: Users,
  LOCATION: MapPin,
  FACTION: Shield,
  LORE_PAGE: BookOpen,
  QUEST: Scroll,
  PLOT_THREAD: Scroll,
  CONSEQUENCE: ShieldAlert,
  TIMELINE_EVENT: History,
  MYSTERY: Search,
};

export const ENTITY_TYPE_PATH: Record<RelatableEntityType, string> = {
  NPC: "npcs",
  LOCATION: "locations",
  FACTION: "factions",
  LORE_PAGE: "lore",
  QUEST: "quests",
  PLOT_THREAD: "plot-threads",
  CONSEQUENCE: "consequences",
  TIMELINE_EVENT: "timeline",
  MYSTERY: "mysteries",
};

export const ENTITY_TYPE_OPTIONS = Object.entries(ENTITY_TYPE_LABELS) as [RelatableEntityType, string][];

/**
 * Função pura (sem acesso a banco) — fica em config.ts, não em queries.ts,
 * porque queries.ts é `server-only` e related-entities-panel.tsx (client)
 * precisa chamar isto em runtime, não só como tipo.
 */
export function getEntityHref(campaignId: string, type: RelatableEntityType, id: string) {
  return `/campaigns/${campaignId}/${ENTITY_TYPE_PATH[type]}/${id}`;
}

export const RELATIONSHIP_TYPE_SUGGESTIONS = [
  "pertence a",
  "mora em",
  "controla",
  "lidera",
  "é membro de",
  "é aliado de",
  "é inimigo de",
  "odeia",
  "ama",
  "teme",
  "trabalha para",
  "protege",
  "traiu",
  "é filho de",
  "é pai/mãe de",
  "é irmão/irmã de",
  "menciona",
];

export const RELATIONSHIP_IMPORTANCE_LABELS: Record<"LOW" | "MEDIUM" | "HIGH", string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
};
