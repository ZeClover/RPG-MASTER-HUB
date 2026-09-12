import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Sparkles,
  ClipboardList,
  Swords,
  Dices,
  Image as ImageIcon,
  Wrench,
  Settings2,
  Settings,
} from "lucide-react";

export interface CampaignNavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  href?: (campaignId: string) => string;
  comingSoonPhase?: string;
}

export const CAMPAIGN_NAV_ITEMS: CampaignNavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: (id) => `/campaigns/${id}/dashboard` },
  { key: "creation", label: "Criação", icon: Sparkles, comingSoonPhase: "Fase 1" },
  { key: "preparation", label: "Preparação", icon: ClipboardList, comingSoonPhase: "Fase 2" },
  { key: "session", label: "Sessão", icon: Swords, comingSoonPhase: "Fase 3" },
  { key: "game", label: "Jogo", icon: Dices, comingSoonPhase: "Fase 6" },
  { key: "media", label: "Mídia", icon: ImageIcon, comingSoonPhase: "Fase 4" },
  { key: "tools", label: "Ferramentas", icon: Wrench, comingSoonPhase: "Fase 6" },
  { key: "system", label: "Sistema", icon: Settings2, comingSoonPhase: "Fase 9" },
  { key: "settings", label: "Configurações", icon: Settings, href: (id) => `/campaigns/${id}/settings` },
];
