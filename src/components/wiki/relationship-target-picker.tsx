"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import type { RelatableEntityType } from "@/generated/prisma/client";
import { searchRelatableEntitiesAction } from "@/modules/creation/relationships/actions";
import { ENTITY_TYPE_OPTIONS } from "@/modules/creation/relationships/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface EntityOption {
  id: string;
  name: string;
  imageUrl: string | null;
  archived: boolean;
}

interface RelationshipTargetPickerProps {
  campaignId: string;
  excludeType: RelatableEntityType;
  excludeId: string;
}

/** Escolhe o tipo do alvo e depois busca (server-side, com debounce) a entidade específica. */
export function RelationshipTargetPicker({ campaignId, excludeType, excludeId }: RelationshipTargetPickerProps) {
  const [type, setType] = useState<RelatableEntityType>(excludeType === "NPC" ? "LOCATION" : "NPC");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EntityOption[]>([]);
  const [selected, setSelected] = useState<EntityOption | null>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    const excludeIds = type === excludeType ? [excludeId] : [];
    startTransition(async () => {
      const rows = await searchRelatableEntitiesAction(campaignId, type, query, excludeIds);
      setResults(rows);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce controla `query`, o resto dispara na hora
  }, [type, open]);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const excludeIds = type === excludeType ? [excludeId] : [];
      startTransition(async () => {
        const rows = await searchRelatableEntitiesAction(campaignId, type, value, excludeIds);
        setResults(rows);
      });
    }, 300);
  }

  function handleTypeChange(value: string) {
    setType(value as RelatableEntityType);
    setSelected(null);
    setQuery("");
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>Relacionar com</Label>
      <div className="flex gap-2">
        <Select value={type} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-36 shrink-0">
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

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="flex-1 justify-between font-normal">
              <span className={cn("truncate", !selected && "text-muted-foreground")}>
                {selected ? selected.name : "Escolha uma entidade…"}
              </span>
              <ChevronsUpDown className="size-4 shrink-0 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <Input
              autoFocus
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Buscar…"
              className="mb-2"
            />
            <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
              {isPending && <p className="px-2 py-1.5 text-xs text-muted-foreground">Buscando…</p>}
              {!isPending && results.length === 0 && (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">Nada encontrado.</p>
              )}
              {results.map((entity) => (
                <button
                  key={entity.id}
                  type="button"
                  onClick={() => {
                    setSelected(entity);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface"
                >
                  {selected?.id === entity.id && <Check className="size-3.5 shrink-0" />}
                  <span className="truncate">{entity.name}</span>
                  {entity.archived && <span className="text-xs text-muted-foreground">(arquivado)</span>}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <input type="hidden" name="targetType" value={type} />
      <input type="hidden" name="targetId" value={selected?.id ?? ""} />
    </div>
  );
}
