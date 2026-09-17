import "server-only";

import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Boxes,
  CalendarCheck,
  Dices,
  GitBranch,
  History,
  Lightbulb,
  MapPin,
  Package,
  Puzzle,
  Scroll,
  Shield,
  ShieldAlert,
  Skull,
  Sparkles,
  UserCircle,
  Users,
} from "lucide-react";

import type { CampaignRole } from "@/generated/prisma/client";
import { countNpcs } from "@/modules/creation/npcs/queries";
import { countLocations } from "@/modules/creation/locations/queries";
import { countFactions } from "@/modules/creation/factions/queries";
import { countLorePages } from "@/modules/creation/lore/queries";
import { countIdeas } from "@/modules/creation/ideas/queries";
import { countCharacters } from "@/modules/players/characters/queries";
import { countSessionPlans } from "@/modules/preparation/session-plans/queries";
import { countQuests } from "@/modules/preparation/quests/queries";
import { countPlotThreads } from "@/modules/preparation/plot-threads/queries";
import { countConsequences } from "@/modules/preparation/consequences/queries";
import { countTimelineEvents } from "@/modules/worldbuilding/timeline/queries";
import { countMysteries } from "@/modules/worldbuilding/mysteries/queries";
import { countMonsters } from "@/modules/gametools/monsters/queries";
import { countItems } from "@/modules/gametools/items/queries";
import { countPowers } from "@/modules/gametools/powers/queries";
import { countRollTables } from "@/modules/gametools/roll-tables/queries";
import { countCategories } from "@/modules/gametools/custom-categories/queries";

/**
 * Registro do Dashboard, orientado a módulo (Fase 11, ver ARCHITECTURE.md,
 * seção 22). Cada entrada aqui é o que vira, quando o módulo está ligado
 * para a campanha (`getEnabledModuleKeys`) E o papel do visitante qualifica,
 * um card de contagem no Dashboard e — quando `newHref` não é `null` — um
 * botão de ação rápida "criar X". `moduleKey` é sempre a mesma `key` usada em
 * `CAMPAIGN_NAV_ITEMS`/`TOGGLEABLE_MODULES` (Fase 10), para nunca existir uma
 * segunda lista de módulos fora de sincronia com a primeira.
 *
 * "Ligado por padrão" (Fase 10) e "aparece neste registro" não são a mesma
 * coisa: módulos como NPCs/Locais/Lore vêm ligados por padrão mas continuam
 * passando pelo mesmo filtro de módulo ligado/desligado de qualquer outro —
 * `alwaysOn` (Dashboard, Configurações, Membros etc.) é quem fica de fora
 * deste arquivo, não `defaultEnabled`.
 */
export interface DashboardModuleCard {
  moduleKey: string;
  /** Rótulo no plural, usado no card de contagem (ex.: "Personagens"). */
  label: string;
  icon: LucideIcon;
  listHref: (campaignId: string) => string;
  /** `null` quando o módulo não tem uma ação de "criar" própria no Dashboard. */
  newHref: (campaignId: string) => string | null;
  createLabel: string | null;
  count: (campaignId: string) => Promise<number>;
  /** Papel mínimo para o card de contagem aparecer. Padrão: `PLAYER` (todo mundo vê). */
  minRole?: CampaignRole;
  /**
   * Papel mínimo para o botão de ação rápida "criar X" aparecer — separado de
   * `minRole` de propósito: a lista da maioria destas entidades é aberta a
   * `PLAYER` (ele só não pode CRIAR — toda rota `/new` de wiki exige `CO_GM`
   * mínimo desde a Fase 2). Sem este campo, um `PLAYER` veria um botão
   * "Criar NPC" apontando para uma rota que dá 404 para ele — exatamente a
   * mesma classe de link morto que a Parte 1 desta fase corrigiu para "Abrir
   * Modo Sessão"/"Rolar Dados". Padrão: igual a `minRole`.
   */
  createMinRole?: CampaignRole;
}

export const DASHBOARD_MODULE_CARDS: DashboardModuleCard[] = [
  {
    moduleKey: "npcs",
    label: "NPCs",
    icon: Users,
    listHref: (id) => `/campaigns/${id}/npcs`,
    newHref: (id) => `/campaigns/${id}/npcs/new`,
    createLabel: "Criar NPC",
    count: countNpcs,
    createMinRole: "CO_GM",
  },
  {
    moduleKey: "characters",
    label: "Personagens",
    icon: UserCircle,
    listHref: (id) => `/campaigns/${id}/characters`,
    newHref: (id) => `/campaigns/${id}/characters/new`,
    createLabel: "Criar Personagem",
    count: countCharacters,
    // Diferente do resto: ficha de personagem pode ser criada pelo próprio jogador (Fase 10).
  },
  {
    moduleKey: "locations",
    label: "Locais",
    icon: MapPin,
    listHref: (id) => `/campaigns/${id}/locations`,
    newHref: (id) => `/campaigns/${id}/locations/new`,
    createLabel: "Criar Local",
    count: countLocations,
    createMinRole: "CO_GM",
  },
  {
    moduleKey: "factions",
    label: "Facções",
    icon: Shield,
    listHref: (id) => `/campaigns/${id}/factions`,
    newHref: (id) => `/campaigns/${id}/factions/new`,
    createLabel: "Criar Facção",
    count: countFactions,
    createMinRole: "CO_GM",
  },
  {
    moduleKey: "lore",
    label: "Lore",
    icon: BookOpen,
    listHref: (id) => `/campaigns/${id}/lore`,
    newHref: (id) => `/campaigns/${id}/lore/new`,
    createLabel: "Criar Lore",
    count: countLorePages,
    createMinRole: "CO_GM",
  },
  {
    moduleKey: "ideas",
    label: "Ideias",
    icon: Lightbulb,
    listHref: (id) => `/campaigns/${id}/ideas`,
    // Idea Vault não tem rota /new própria — a criação é inline (QuickAddIdeaForm), aberta a
    // qualquer membro, direto na lista (mesmo padrão já usado no command palette).
    newHref: (id) => `/campaigns/${id}/ideas`,
    createLabel: "Nova Ideia",
    count: countIdeas,
  },
  {
    moduleKey: "session-plans",
    label: "Sessões",
    icon: CalendarCheck,
    listHref: (id) => `/campaigns/${id}/session-plans`,
    newHref: (id) => `/campaigns/${id}/session-plans/new`,
    createLabel: "Nova Sessão",
    count: countSessionPlans,
    // SessionPlan é material de preparação do mestre — sem `visibility`, a própria listagem já
    // exige CO_GM (ver `session-plans/queries.ts`); o card espelha o mesmo mínimo, não só a ação.
    minRole: "CO_GM",
    createMinRole: "CO_GM",
  },
  {
    moduleKey: "quests",
    label: "Missões",
    icon: Scroll,
    listHref: (id) => `/campaigns/${id}/quests`,
    newHref: (id) => `/campaigns/${id}/quests/new`,
    createLabel: "Criar Missão",
    count: countQuests,
    createMinRole: "CO_GM",
  },
  {
    moduleKey: "plot-threads",
    label: "Tramas",
    icon: GitBranch,
    listHref: (id) => `/campaigns/${id}/plot-threads`,
    newHref: (id) => `/campaigns/${id}/plot-threads/new`,
    createLabel: "Criar Trama",
    count: countPlotThreads,
    createMinRole: "CO_GM",
  },
  {
    moduleKey: "consequences",
    label: "Consequências",
    icon: ShieldAlert,
    listHref: (id) => `/campaigns/${id}/consequences`,
    newHref: (id) => `/campaigns/${id}/consequences/new`,
    createLabel: "Criar Consequência",
    count: countConsequences,
    createMinRole: "CO_GM",
  },
  {
    moduleKey: "timeline",
    label: "Linha do Tempo",
    icon: History,
    listHref: (id) => `/campaigns/${id}/timeline`,
    newHref: (id) => `/campaigns/${id}/timeline/new`,
    createLabel: "Criar Evento",
    count: countTimelineEvents,
    createMinRole: "CO_GM",
  },
  {
    moduleKey: "mysteries",
    label: "Mistérios",
    icon: Puzzle,
    listHref: (id) => `/campaigns/${id}/mysteries`,
    newHref: (id) => `/campaigns/${id}/mysteries/new`,
    createLabel: "Criar Mistério",
    count: countMysteries,
    createMinRole: "CO_GM",
  },
  {
    moduleKey: "monsters",
    label: "Monstros",
    icon: Skull,
    listHref: (id) => `/campaigns/${id}/monsters`,
    newHref: (id) => `/campaigns/${id}/monsters/new`,
    createLabel: "Criar Monstro",
    count: countMonsters,
    createMinRole: "CO_GM",
  },
  {
    moduleKey: "items",
    label: "Itens",
    icon: Package,
    listHref: (id) => `/campaigns/${id}/items`,
    newHref: (id) => `/campaigns/${id}/items/new`,
    createLabel: "Criar Item",
    count: countItems,
    createMinRole: "CO_GM",
  },
  {
    moduleKey: "powers",
    label: "Poderes",
    icon: Sparkles,
    listHref: (id) => `/campaigns/${id}/powers`,
    newHref: (id) => `/campaigns/${id}/powers/new`,
    createLabel: "Criar Poder",
    count: countPowers,
    createMinRole: "CO_GM",
  },
  {
    moduleKey: "tables",
    label: "Tabelas",
    icon: Dices,
    listHref: (id) => `/campaigns/${id}/tables`,
    newHref: (id) => `/campaigns/${id}/tables/new`,
    createLabel: "Criar Tabela",
    // Só conta `kind: GENERIC` (Table Builder). Loot Generator é o mesmo modelo `RollTable` com
    // `kind: LOOT`, sob o módulo `loot` — fora desta primeira leva de cards do Dashboard (não
    // listado no pedido original desta fase); somar os dois kinds aqui misturaria a contagem de
    // dois módulos toggleáveis diferentes num único card.
    count: (campaignId) => countRollTables(campaignId, "GENERIC"),
    // RollTable é ferramenta de mesa do mestre, sem `visibility` — a própria listagem já exige
    // CO_GM (ver `roll-tables/queries.ts`).
    minRole: "CO_GM",
    createMinRole: "CO_GM",
  },
  {
    moduleKey: "custom-categories",
    label: "Categorias Personalizadas",
    icon: Boxes,
    listHref: (id) => `/campaigns/${id}/custom-categories`,
    newHref: (id) => `/campaigns/${id}/custom-categories/new`,
    createLabel: "Nova Categoria",
    count: countCategories,
    createMinRole: "CO_GM",
  },
];
