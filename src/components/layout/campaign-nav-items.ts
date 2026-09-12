import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ClipboardList,
  Dices,
  Image as ImageIcon,
  LayoutDashboard,
  Lightbulb,
  MapPin,
  Search,
  Settings,
  Settings2,
  Shield,
  Swords,
  Tag,
  Users,
  Wrench,
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

  { key: "preparation", label: "Preparação", icon: ClipboardList, comingSoonPhase: "Fase 2", section: "Em breve" },
  { key: "session", label: "Sessão", icon: Swords, comingSoonPhase: "Fase 3", section: "Em breve" },
  { key: "game", label: "Jogo", icon: Dices, comingSoonPhase: "Fase 6", section: "Em breve" },
  { key: "media", label: "Mídia", icon: ImageIcon, comingSoonPhase: "Fase 4", section: "Em breve" },
  { key: "tools", label: "Ferramentas", icon: Wrench, comingSoonPhase: "Fase 6", section: "Em breve" },
  { key: "system", label: "Sistema", icon: Settings2, comingSoonPhase: "Fase 9", section: "Em breve" },

  { key: "settings", label: "Configurações", icon: Settings, href: (id) => `/campaigns/${id}/settings` },
];
