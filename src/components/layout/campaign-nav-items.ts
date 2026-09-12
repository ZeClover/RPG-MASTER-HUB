import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Brain,
  CalendarCheck,
  Clock,
  Dices,
  Gem,
  GitBranch,
  History,
  LayoutDashboard,
  Lightbulb,
  MapPin,
  Music,
  Package,
  Puzzle,
  Scroll,
  Search,
  Settings,
  Settings2,
  Shield,
  ShieldAlert,
  Skull,
  Sparkles,
  Swords,
  Tag,
  TreeDeciduous,
  Users,
} from "lucide-react";

export interface CampaignNavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  href?: (campaignId: string) => string;
  comingSoonPhase?: string;
  section?: string;
}

export const CAMPAIGN_NAV_ITEMS: CampaignNavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: (id) => `/campaigns/${id}/dashboard` },

  { key: "npcs", label: "NPCs", icon: Users, href: (id) => `/campaigns/${id}/npcs`, section: "Criação" },
  { key: "locations", label: "Locais", icon: MapPin, href: (id) => `/campaigns/${id}/locations`, section: "Criação" },
  { key: "factions", label: "Facções", icon: Shield, href: (id) => `/campaigns/${id}/factions`, section: "Criação" },
  { key: "lore", label: "Lore", icon: BookOpen, href: (id) => `/campaigns/${id}/lore`, section: "Criação" },
  { key: "ideas", label: "Ideias", icon: Lightbulb, href: (id) => `/campaigns/${id}/ideas`, section: "Criação" },
  { key: "tags", label: "Tags", icon: Tag, href: (id) => `/campaigns/${id}/tags`, section: "Criação" },
  { key: "search", label: "Busca", icon: Search, href: (id) => `/campaigns/${id}/search`, section: "Criação" },

  {
    key: "session-plans",
    label: "Sessões",
    icon: CalendarCheck,
    href: (id) => `/campaigns/${id}/session-plans`,
    section: "Preparação",
  },
  { key: "quests", label: "Missões", icon: Scroll, href: (id) => `/campaigns/${id}/quests`, section: "Preparação" },
  {
    key: "plot-threads",
    label: "Tramas",
    icon: GitBranch,
    href: (id) => `/campaigns/${id}/plot-threads`,
    section: "Preparação",
  },
  {
    key: "consequences",
    label: "Consequências",
    icon: ShieldAlert,
    href: (id) => `/campaigns/${id}/consequences`,
    section: "Preparação",
  },

  { key: "session", label: "Modo Sessão", icon: Swords, href: (id) => `/campaigns/${id}/session`, section: "Sessão" },

  {
    key: "timeline",
    label: "Linha do Tempo",
    icon: History,
    href: (id) => `/campaigns/${id}/timeline`,
    section: "Mundo",
  },
  { key: "clocks", label: "Relógios", icon: Clock, href: (id) => `/campaigns/${id}/clocks`, section: "Mundo" },
  {
    key: "family-tree",
    label: "Family Tree",
    icon: TreeDeciduous,
    href: (id) => `/campaigns/${id}/family-tree`,
    section: "Mundo",
  },
  {
    key: "mysteries",
    label: "Mystery Board",
    icon: Puzzle,
    href: (id) => `/campaigns/${id}/mysteries`,
    section: "Mundo",
  },

  { key: "monsters", label: "Monstros", icon: Skull, href: (id) => `/campaigns/${id}/monsters`, section: "Jogo" },
  { key: "items", label: "Itens", icon: Package, href: (id) => `/campaigns/${id}/items`, section: "Jogo" },
  { key: "powers", label: "Poderes", icon: Sparkles, href: (id) => `/campaigns/${id}/powers`, section: "Jogo" },

  { key: "audio", label: "Music/SFX Board", icon: Music, href: (id) => `/campaigns/${id}/audio`, section: "Áudio" },

  { key: "tables", label: "Tabelas", icon: Dices, href: (id) => `/campaigns/${id}/tables`, section: "Ferramentas" },
  { key: "loot", label: "Loot Generator", icon: Gem, href: (id) => `/campaigns/${id}/loot`, section: "Ferramentas" },

  { key: "brain", label: "Campaign Brain", icon: Brain, href: (id) => `/campaigns/${id}/brain`, section: "Inteligência" },

  { key: "system", label: "Sistema", icon: Settings2, comingSoonPhase: "Fase 9", section: "Em breve" },

  { key: "settings", label: "Configurações", icon: Settings, href: (id) => `/campaigns/${id}/settings` },
];
