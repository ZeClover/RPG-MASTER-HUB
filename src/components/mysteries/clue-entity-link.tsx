"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Link2, Link2Off } from "lucide-react";

import type { RelatableEntityType } from "@/generated/prisma/client";
import { linkClueEntityAction } from "@/modules/worldbuilding/mysteries/clue-actions";
import { searchRelatableEntitiesAction } from "@/modules/creation/relationships/actions";
import { ENTITY_TYPE_OPTIONS, getEntityHref } from "@/modules/creation/relationships/config";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LinkedEntity {
  type: RelatableEntityType;
  id: string;
  name: string;
}

interface ClueEntityLinkProps {
  campaignId: string;
  mysteryId: string;
  clueId: string;
  linked: LinkedEntity | null;
}

export function ClueEntityLink({ campaignId, mysteryId, clueId, linked }: ClueEntityLinkProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<RelatableEntityType>("NPC");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string }[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const [isLinking, startLinkTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    startSearchTransition(async () => {
      const rows = await searchRelatableEntitiesAction(campaignId, type, query);
      setResults(rows);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce controla `query`, o resto dispara na hora
  }, [type, open]);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startSearchTransition(async () => {
        const rows = await searchRelatableEntitiesAction(campaignId, type, value);
        setResults(rows);
      });
    }, 300);
  }

  if (linked) {
    return (
      <span className="flex shrink-0 items-center gap-1 text-xs">
        <Link href={getEntityHref(campaignId, linked.type, linked.id)} className="text-primary hover:underline">
          {linked.name}
        </Link>
        <button
          type="button"
          disabled={isLinking}
          onClick={() => startLinkTransition(() => linkClueEntityAction(campaignId, mysteryId, clueId, null, null))}
          className="rounded p-0.5 text-muted-foreground opacity-60 transition-opacity hover:opacity-100"
          aria-label="Remover vínculo"
        >
          <Link2Off className="size-3.5" />
        </button>
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="shrink-0 rounded p-1 text-muted-foreground opacity-60 transition-opacity hover:bg-surface-elevated hover:opacity-100"
          aria-label="Vincular a uma entidade"
        >
          <Link2 className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="mb-2 flex gap-2">
          <Select value={type} onValueChange={(value) => setType(value as RelatableEntityType)}>
            <SelectTrigger className="w-32 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_TYPE_OPTIONS.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input value={query} onChange={(event) => handleQueryChange(event.target.value)} placeholder="Buscar…" />
        </div>
        <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
          {isSearching && <p className="px-2 py-1.5 text-xs text-muted-foreground">Buscando…</p>}
          {!isSearching && results.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">Nada encontrado.</p>
          )}
          {results.map((entity) => (
            <button
              key={entity.id}
              type="button"
              disabled={isLinking}
              onClick={() => {
                startLinkTransition(() => linkClueEntityAction(campaignId, mysteryId, clueId, type, entity.id));
                setOpen(false);
              }}
              className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface"
            >
              {entity.name}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
