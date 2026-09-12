"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CalendarCheck, GitBranch, Lightbulb, MapPin, Scroll, Shield, ShieldAlert, Users } from "lucide-react";

import type { SearchResult } from "@/modules/core/search/queries";
import { searchCampaignAction } from "@/modules/core/search/actions";
import { SEARCH_RESULT_ICONS, SEARCH_RESULT_LABELS } from "@/modules/core/search/config";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { OPEN_COMMAND_PALETTE_EVENT } from "@/components/wiki/search-trigger-button";

interface CommandPaletteProps {
  campaignId: string;
}

function quickActions(campaignId: string) {
  return [
    { key: "new-npc", label: "Criar NPC", icon: Users, href: `/campaigns/${campaignId}/npcs/new` },
    { key: "new-location", label: "Criar Local", icon: MapPin, href: `/campaigns/${campaignId}/locations/new` },
    { key: "new-faction", label: "Criar Facção", icon: Shield, href: `/campaigns/${campaignId}/factions/new` },
    { key: "new-lore", label: "Criar Lore", icon: BookOpen, href: `/campaigns/${campaignId}/lore/new` },
    { key: "new-idea", label: "Criar Ideia", icon: Lightbulb, href: `/campaigns/${campaignId}/ideas` },
    { key: "new-session-plan", label: "Nova Sessão", icon: CalendarCheck, href: `/campaigns/${campaignId}/session-plans/new` },
    { key: "new-quest", label: "Criar Missão", icon: Scroll, href: `/campaigns/${campaignId}/quests/new` },
    { key: "new-plot-thread", label: "Criar Trama", icon: GitBranch, href: `/campaigns/${campaignId}/plot-threads/new` },
    {
      key: "new-consequence",
      label: "Criar Consequência",
      icon: ShieldAlert,
      href: `/campaigns/${campaignId}/consequences/new`,
    },
  ];
}

export function CommandPalette({ campaignId }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    function handleOpenEvent() {
      setOpen(true);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, handleOpenEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, handleOpenEvent);
    };
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setResults([]);
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const rows = await searchCampaignAction(campaignId, value);
        setResults(rows);
      });
    }, 250);
  }

  function go(href: string) {
    handleOpenChange(false);
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="top-24 max-w-lg translate-y-0 gap-0 p-0">
        <DialogTitle className="sr-only">Pesquisar</DialogTitle>
        <div className="border-b border-border p-3">
          <Input
            autoFocus
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder="Pesquisar ou executar um comando…"
            className="border-0 px-1 focus-visible:ring-0"
          />
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim() === "" ? (
            <>
              <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ações rápidas
              </p>
              {quickActions(campaignId).map((action) => (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => go(action.href)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-surface-elevated"
                >
                  <action.icon className="size-4" /> {action.label}
                </button>
              ))}
            </>
          ) : (
            <>
              {isPending && <p className="px-2 py-2 text-xs text-muted-foreground">Buscando…</p>}
              {!isPending && results.length === 0 && (
                <p className="px-2 py-2 text-xs text-muted-foreground">Nada encontrado.</p>
              )}
              {results.map((result) => {
                const Icon = SEARCH_RESULT_ICONS[result.type];
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    type="button"
                    onClick={() => go(result.href)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-surface-elevated"
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{result.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{SEARCH_RESULT_LABELS[result.type]}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
