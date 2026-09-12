"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CAMPAIGN_NAV_ITEMS } from "@/components/layout/campaign-nav-items";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CampaignSidebarProps {
  campaignId: string;
}

function NavEntries({ campaignId, orientation }: CampaignSidebarProps & { orientation: "vertical" | "horizontal" }) {
  const pathname = usePathname();

  return (
    <>
      {CAMPAIGN_NAV_ITEMS.map((item) => {
        const href = item.href?.(campaignId);
        const isActive = Boolean(href) && pathname === href;
        const Icon = item.icon;

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

        if (!href) {
          return (
            <Tooltip key={item.key}>
              <TooltipTrigger className="text-left">{content}</TooltipTrigger>
              <TooltipContent>Em breve — chega na {item.comingSoonPhase}</TooltipContent>
            </Tooltip>
          );
        }

        return (
          <Link key={item.key} href={href}>
            {content}
          </Link>
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
