import Link from "next/link";
import { Search } from "lucide-react";

import { UserMenu } from "@/components/layout/user-menu";
import { SyncStatusIndicator } from "@/components/layout/sync-status-indicator";
import { BrandMark } from "@/components/layout/brand-mark";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SessionUserLike } from "@/types/session";

interface HomeTopbarProps {
  user: SessionUserLike;
}

export function HomeTopbar({ user }: HomeTopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
      <Link href="/home" className="flex items-center gap-2">
        <BrandMark />
        <span className="hidden text-sm font-semibold tracking-tight sm:inline">RPG Master Hub</span>
      </Link>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <Tooltip>
          <TooltipTrigger
            aria-disabled="true"
            className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground opacity-50"
          >
            <Search className="size-4" />
            <span className="hidden sm:inline">Pesquisar</span>
            <kbd className="hidden rounded border border-border px-1 text-[10px] sm:inline">Ctrl K</kbd>
          </TooltipTrigger>
          <TooltipContent>Busca global chega na Fase 1</TooltipContent>
        </Tooltip>
        <SyncStatusIndicator />
        <UserMenu name={user.name} email={user.email} image={user.image} />
      </div>
    </header>
  );
}
