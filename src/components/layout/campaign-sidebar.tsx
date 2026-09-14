"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { CampaignRole } from "@/generated/prisma/client";
import { CAMPAIGN_NAV_ITEMS } from "@/components/layout/campaign-nav-items";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { roleAtLeast } from "@/lib/roles";

interface CampaignSidebarProps {
  campaignId: string;
  role: CampaignRole;
  /** Chaves de módulos ligados para esta campanha (Fase 10) — itens `alwaysOn` ignoram isto. */
  enabledModuleKeys: string[];
}

function NavEntries({
  campaignId,
  role,
  enabledModuleKeys,
  orientation,
}: CampaignSidebarProps & { orientation: "vertical" | "horizontal" }) {
  const pathname = usePathname();
  // Player View (Fase 9): itens com `minRole` ficam fora da navegação para
  // quem não tem o papel — não só desabilitados, já que não são "em breve",
  // são "não é para você" (ex.: Membros, gestão só de CO_GM/OWNER).
  // Módulos de campanha (Fase 10): itens não-`alwaysOn` só aparecem se a
  // campanha os tiver ligado — declutter da navegação, não controle de acesso
  // (ver ARCHITECTURE.md, seção 21).
  const items = CAMPAIGN_NAV_ITEMS.filter(
    (item) =>
      roleAtLeast(role, item.minRole ?? "PLAYER") && (item.alwaysOn || enabledModuleKeys.includes(item.key)),
  );

  return (
    <>
      {items.map((item, index) => {
        const href = item.href?.(campaignId);
        const isActive = Boolean(href) && (pathname === href || pathname.startsWith(`${href}/`));
        const Icon = item.icon;
        const previousSection = index > 0 ? items[index - 1].section : undefined;
        const showSectionHeader = orientation === "vertical" && item.section !== previousSection;

        const content = (
          <span
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              orientation === "horizontal" && "flex-col gap-1 px-3 py-2 text-[11px]",
              isActive
                ? "bg-primary/15 text-primary"
                : href
                  ? "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                  : "cursor-not-allowed text-muted-foreground/50",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className={orientation === "vertical" ? "" : "whitespace-nowrap"}>{item.label}</span>
          </span>
        );

        const entry = !href ? (
          <Tooltip key={item.key}>
            <TooltipTrigger className="text-left">{content}</TooltipTrigger>
            <TooltipContent>Em breve — chega na {item.comingSoonPhase}</TooltipContent>
          </Tooltip>
        ) : (
          <Link key={item.key} href={href}>
            {content}
          </Link>
        );

        if (!showSectionHeader) return entry;

        return (
          <div key={`section-${item.key}`} className="flex flex-col gap-1">
            {item.section && (
              <p className="mt-2 px-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70 first:mt-0">
                {item.section}
              </p>
            )}
            {entry}
          </div>
        );
      })}
    </>
  );
}

export function CampaignSidebar(props: CampaignSidebarProps) {
  return (
    <>
      <nav className="hidden w-56 shrink-0 flex-col gap-1 border-r border-border p-3 sm:flex">
        <NavEntries {...props} orientation="vertical" />
      </nav>
      <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-border p-2 sm:hidden">
        <NavEntries {...props} orientation="horizontal" />
      </nav>
    </>
  );
}
