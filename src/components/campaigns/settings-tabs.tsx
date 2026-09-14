"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/** Abas de Configurações (Fase 10) — mesma linguagem visual de item ativo da sidebar (`bg-primary/15 text-primary`). */
export function SettingsTabs({ campaignId }: { campaignId: string }) {
  const pathname = usePathname();

  const tabs = [
    { href: `/campaigns/${campaignId}/settings`, label: "Geral" },
    { href: `/campaigns/${campaignId}/settings/modules`, label: "Módulos" },
  ];

  return (
    <nav className="flex w-full gap-1 border-b border-border">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-t-lg px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
