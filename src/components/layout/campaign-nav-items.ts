import type { LucideIcon } from "lucide-react";
import type { CampaignRole } from "@/generated/prisma/client";
import {
  Activity,
  Archive,
  BookOpen,
  Boxes,
  Brain,
  CalendarCheck,
  Clock,
  Dices,
  FileText,
  Gem,
  GitBranch,
  History,
  LayoutDashboard,
  Lightbulb,
  MapPin,
  Music,
  NotebookText,
  Package,
  Puzzle,
  Radar,
  Scroll,
  Search,
  Settings,
  Settings2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Shuffle,
  Skull,
  Sparkles,
  Stamp,
  Swords,
  Tag,
  TreeDeciduous,
  UserCircle,
  UserCog,
  Users,
} from "lucide-react";

export interface CampaignNavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  href?: (campaignId: string) => string;
  comingSoonPhase?: string;
  section?: string;
  /** Papel mínimo para o item aparecer na navegação (Fase 9). Padrão: PLAYER (todo mundo vê). */
  minRole?: CampaignRole;
  /**
   * Item estrutural (Fase 10, ver ARCHITECTURE.md, seção 21) — sempre visível,
   * nunca passa pelo toggle de módulos da campanha. `defaultEnabled` não se
   * aplica quando isto é `true`.
   */
  alwaysOn?: boolean;
  /** Estado padrão do módulo quando a campanha ainda não tem override salvo. Ignorado quando `alwaysOn` é `true`. Padrão: `false` (desligado). */
  defaultEnabled?: boolean;
  /** Frase curta em PT-BR explicando o módulo, usada na aba Configurações → Módulos. Só necessária em itens toggleáveis (`!alwaysOn`). */
  description?: string;
}

export const CAMPAIGN_NAV_ITEMS: CampaignNavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: (id) => `/campaigns/${id}/dashboard`, alwaysOn: true },

  { key: "npcs", label: "NPCs", icon: Users, href: (id) => `/campaigns/${id}/npcs`, section: "Criação", defaultEnabled: true, description: "Personagens não jogáveis da campanha." },
  {
    key: "characters",
    label: "Personagens",
    icon: UserCircle,
    href: (id) => `/campaigns/${id}/characters`,
    section: "Criação",
    defaultEnabled: true,
    description: "Fichas simples dos personagens dos jogadores.",
  },
  {
    key: "locations",
    label: "Locais",
    icon: MapPin,
    href: (id) => `/campaigns/${id}/locations`,
    section: "Criação",
    defaultEnabled: true,
    description: "Lugares e mapas da campanha.",
  },
  {
    key: "factions",
    label: "Facções",
    icon: Shield,
    href: (id) => `/campaigns/${id}/factions`,
    section: "Criação",
    defaultEnabled: true,
    description: "Grupos, organizações e facções em jogo.",
  },
  {
    key: "lore",
    label: "Lore",
    icon: BookOpen,
    href: (id) => `/campaigns/${id}/lore`,
    section: "Criação",
    defaultEnabled: true,
    description: "Enciclopédia livre do mundo da campanha.",
  },
  {
    key: "ideas",
    label: "Ideias",
    icon: Lightbulb,
    href: (id) => `/campaigns/${id}/ideas`,
    section: "Criação",
    defaultEnabled: false,
    description: "Rascunhos e ideias soltas ainda não desenvolvidas.",
  },
  { key: "tags", label: "Tags", icon: Tag, href: (id) => `/campaigns/${id}/tags`, section: "Criação", alwaysOn: true },
  { key: "search", label: "Busca", icon: Search, href: (id) => `/campaigns/${id}/search`, section: "Criação", alwaysOn: true },

  {
    key: "session-plans",
    label: "Sessões",
    icon: CalendarCheck,
    href: (id) => `/campaigns/${id}/session-plans`,
    section: "Preparação",
    defaultEnabled: true,
    description: "Planejamento de sessão — pauta, cenas e checklist.",
  },
  {
    key: "quests",
    label: "Missões",
    icon: Scroll,
    href: (id) => `/campaigns/${id}/quests`,
    section: "Preparação",
    defaultEnabled: false,
    description: "Missões e objetivos ativos da campanha.",
  },
  {
    key: "plot-threads",
    label: "Tramas",
    icon: GitBranch,
    href: (id) => `/campaigns/${id}/plot-threads`,
    section: "Preparação",
    defaultEnabled: false,
    description: "Fios narrativos em andamento na campanha.",
  },
  {
    key: "consequences",
    label: "Consequências",
    icon: ShieldAlert,
    href: (id) => `/campaigns/${id}/consequences`,
    section: "Preparação",
    defaultEnabled: false,
    description: "Consequências pendentes das escolhas do grupo.",
  },

  {
    key: "session",
    label: "Modo Sessão",
    icon: Swords,
    href: (id) => `/campaigns/${id}/session`,
    section: "Sessão",
    defaultEnabled: true,
    description: "Painel de mesa ao vivo — dados, log e combate.",
  },
  {
    key: "handouts",
    label: "Handouts",
    icon: FileText,
    href: (id) => `/campaigns/${id}/handouts`,
    section: "Sessão",
    defaultEnabled: true,
    description: "Documentos e imagens entregues aos jogadores durante a sessão.",
  },

  {
    key: "timeline",
    label: "Linha do Tempo",
    icon: History,
    href: (id) => `/campaigns/${id}/timeline`,
    section: "Mundo",
    defaultEnabled: false,
    description: "Linha do tempo de eventos da campanha.",
  },
  {
    key: "clocks",
    label: "Relógios",
    icon: Clock,
    href: (id) => `/campaigns/${id}/clocks`,
    section: "Mundo",
    defaultEnabled: false,
    description: "Relógios narrativos para acompanhar ameaças e objetivos.",
  },
  {
    key: "family-tree",
    label: "Family Tree",
    icon: TreeDeciduous,
    href: (id) => `/campaigns/${id}/family-tree`,
    section: "Mundo",
    defaultEnabled: false,
    description: "Árvore de parentesco entre os NPCs da campanha.",
  },
  {
    key: "mysteries",
    label: "Mystery Board",
    icon: Puzzle,
    href: (id) => `/campaigns/${id}/mysteries`,
    section: "Mundo",
    defaultEnabled: false,
    description: "Mistérios e investigações com pistas.",
  },

  {
    key: "monsters",
    label: "Monstros",
    icon: Skull,
    href: (id) => `/campaigns/${id}/monsters`,
    section: "Jogo",
    defaultEnabled: false,
    description: "Bestiário de criaturas para os combates.",
  },
  {
    key: "items",
    label: "Itens",
    icon: Package,
    href: (id) => `/campaigns/${id}/items`,
    section: "Jogo",
    defaultEnabled: false,
    description: "Itens, equipamentos e artefatos da campanha.",
  },
  {
    key: "powers",
    label: "Poderes",
    icon: Sparkles,
    href: (id) => `/campaigns/${id}/powers`,
    section: "Jogo",
    defaultEnabled: false,
    description: "Poderes, magias e habilidades especiais.",
  },
  {
    key: "system",
    label: "Sistema",
    icon: Settings2,
    href: (id) => `/campaigns/${id}/system`,
    section: "Jogo",
    defaultEnabled: false,
    description: "Construtor de sistema — atributos, recursos, perícias, condições, fórmulas de rolagem e a ficha da campanha.",
  },

  {
    key: "audio",
    label: "Music/SFX Board",
    icon: Music,
    href: (id) => `/campaigns/${id}/audio`,
    section: "Áudio",
    defaultEnabled: false,
    description: "Trilha sonora e efeitos tocados pelos bots do Discord.",
  },

  {
    key: "tables",
    label: "Tabelas",
    icon: Dices,
    href: (id) => `/campaigns/${id}/tables`,
    section: "Ferramentas",
    defaultEnabled: false,
    description: "Tabelas de rolagem genéricas (d20, d100, ou qualquer faixa).",
  },
  {
    key: "loot",
    label: "Loot Generator",
    icon: Gem,
    href: (id) => `/campaigns/${id}/loot`,
    section: "Ferramentas",
    defaultEnabled: false,
    description: "Gerador de recompensas sorteadas em tabelas próprias.",
  },

  {
    key: "brain",
    label: "Campaign Brain",
    icon: Brain,
    href: (id) => `/campaigns/${id}/brain`,
    section: "Inteligência",
    defaultEnabled: false,
    description: "Visão agregada e estatísticas da campanha.",
  },
  {
    key: "context",
    label: "Context Engine",
    icon: Radar,
    href: (id) => `/campaigns/${id}/context`,
    section: "Inteligência",
    defaultEnabled: false,
    description: "Recomendações de conteúdo relevante para o momento atual.",
  },
  {
    key: "health",
    label: "Campaign Health",
    icon: Activity,
    href: (id) => `/campaigns/${id}/health`,
    section: "Inteligência",
    defaultEnabled: false,
    description: "Diagnóstico de conteúdo esquecido ou desatualizado.",
  },
  {
    key: "graveyard",
    label: "Content Graveyard",
    icon: Archive,
    href: (id) => `/campaigns/${id}/graveyard`,
    section: "Inteligência",
    defaultEnabled: false,
    description: "Conteúdo arquivado que pode ser reaproveitado.",
  },

  {
    key: "lore-guardian",
    label: "Lore Guardian",
    icon: ShieldCheck,
    href: (id) => `/campaigns/${id}/lore-guardian`,
    section: "Copiloto",
    defaultEnabled: false,
    description: "Checagem heurística de consistência da lore.",
  },
  {
    key: "canon-checker",
    label: "Canon Checker",
    icon: Stamp,
    href: (id) => `/campaigns/${id}/canon-checker`,
    section: "Copiloto",
    defaultEnabled: false,
    description: "Verificação de contradições contra o cânone da campanha.",
  },
  {
    key: "campaign-recall",
    label: "Campaign Recall",
    icon: NotebookText,
    href: (id) => `/campaigns/${id}/campaign-recall`,
    section: "Copiloto",
    defaultEnabled: false,
    description: "Recapitulação da campanha por template.",
  },
  {
    key: "consequence-suggester",
    label: "Consequence Suggester",
    icon: Shuffle,
    href: (id) => `/campaigns/${id}/consequence-suggester`,
    section: "Copiloto",
    defaultEnabled: false,
    description: "Gerador combinatório de sugestões de consequência.",
  },

  {
    key: "custom-categories",
    label: "Categorias Personalizadas",
    icon: Boxes,
    href: (id) => `/campaigns/${id}/custom-categories`,
    section: "Arsenal",
    defaultEnabled: false,
    description: "Crie categorias próprias — matéria escolar, artes importantes, ou o que sua campanha precisar.",
  },

  {
    key: "members",
    label: "Membros",
    icon: UserCog,
    href: (id) => `/campaigns/${id}/members`,
    minRole: "CO_GM",
    alwaysOn: true,
  },
  { key: "settings", label: "Configurações", icon: Settings, href: (id) => `/campaigns/${id}/settings`, alwaysOn: true },
];

/**
 * Módulos alternáveis na aba Configurações → Módulos (Fase 10, ver
 * ARCHITECTURE.md, seção 21) — todo item de `CAMPAIGN_NAV_ITEMS` que não é
 * `alwaysOn`. Derivado do registro para nunca duas listas de módulos saírem
 * de sincronia.
 */
export interface ToggleableModule {
  key: string;
  label: string;
  section?: string;
  description: string;
  defaultEnabled: boolean;
}

export const TOGGLEABLE_MODULES: ToggleableModule[] = CAMPAIGN_NAV_ITEMS.filter((item) => !item.alwaysOn).map(
  (item) => ({
    key: item.key,
    label: item.label,
    section: item.section,
    description: item.description ?? "",
    defaultEnabled: item.defaultEnabled ?? false,
  }),
);
