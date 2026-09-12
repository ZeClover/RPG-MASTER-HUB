"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { searchRelatableEntitiesAction } from "@/modules/creation/relationships/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface NpcOption {
  id: string;
  name: string;
  imageUrl: string | null;
  archived: boolean;
}

interface FamilyNpcPickerProps {
  campaignId: string;
  excludeId: string;
  name?: string;
}

/** Igual ao seletor de alvo de Relacionamentos, mas travado no tipo NPC — não há por que reconstruir a busca. */
export function FamilyNpcPicker({ campaignId, excludeId, name = "otherNpcId" }: FamilyNpcPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NpcOption[]>([]);
  const [selected, setSelected] = useState<NpcOption | null>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      const rows = await searchRelatableEntitiesAction(campaignId, "NPC", query, [excludeId]);
      setResults(rows);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce controla `query`, o resto dispara na hora
  }, [open]);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const rows = await searchRelatableEntitiesAction(campaignId, "NPC", value, [excludeId]);
        setResults(rows);
      });
    }, 300);
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>NPC</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="justify-between font-normal">
            <span className={cn("truncate", !selected && "text-muted-foreground")}>
              {selected ? selected.name : "Escolha um NPC…"}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <Input
            autoFocus
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder="Buscar NPC…"
            className="mb-2"
          />
          <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
            {isPending && <p className="px-2 py-1.5 text-xs text-muted-foreground">Buscando…</p>}
            {!isPending && results.length === 0 && (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">Nada encontrado.</p>
            )}
            {results.map((npc) => (
              <button
                key={npc.id}
                type="button"
                onClick={() => {
                  setSelected(npc);
                  setOpen(false);
                }}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface"
              >
                {selected?.id === npc.id && <Check className="size-3.5 shrink-0" />}
                <span className="truncate">{npc.name}</span>
                {npc.archived && <span className="text-xs text-muted-foreground">(arquivado)</span>}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <input type="hidden" name={name} value={selected?.id ?? ""} />
    </div>
  );
}
