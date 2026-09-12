"use client";

import { Search } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const OPEN_COMMAND_PALETTE_EVENT = "rpg-hub:open-command-palette";

export function SearchTriggerButton() {
  return (
    <Tooltip>
      <TooltipTrigger
        onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT))}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-surface-elevated"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Pesquisar</span>
        <kbd className="hidden rounded border border-border px-1 text-[10px] sm:inline">Ctrl K</kbd>
      </TooltipTrigger>
      <TooltipContent>Buscar ou executar um comando</TooltipContent>
    </Tooltip>
  );
}
