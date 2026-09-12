"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronsUpDown } from "lucide-react";

import { searchLocationsAction } from "@/modules/creation/locations/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface LocationOption {
  id: string;
  name: string;
}

interface LocationParentPickerProps {
  campaignId: string;
  currentLocationId?: string;
  defaultParent?: LocationOption | null;
}

export function LocationParentPicker({ campaignId, currentLocationId, defaultParent }: LocationParentPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationOption[]>([]);
  const [selected, setSelected] = useState<LocationOption | null>(defaultParent ?? null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      const rows = await searchLocationsAction(campaignId, query, currentLocationId);
      setResults(rows);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só recarrega ao abrir; digitação usa o debounce abaixo
  }, [open]);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const rows = await searchLocationsAction(campaignId, value, currentLocationId);
        setResults(rows);
      });
    }, 300);
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>Local pai (opcional)</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="justify-between font-normal">
            <span className={cn("truncate", !selected && "text-muted-foreground")}>
              {selected ? selected.name : "Nenhum (topo da hierarquia)"}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <Input
            autoFocus
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder="Buscar local…"
            className="mb-2"
          />
          <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setOpen(false);
              }}
              className="rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-surface"
            >
              Nenhum (topo da hierarquia)
            </button>
            {isPending && <p className="px-2 py-1.5 text-xs text-muted-foreground">Buscando…</p>}
            {results.map((location) => (
              <button
                key={location.id}
                type="button"
                onClick={() => {
                  setSelected(location);
                  setOpen(false);
                }}
                className="truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface"
              >
                {location.name}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <input type="hidden" name="parentLocationId" value={selected?.id ?? ""} />
    </div>
  );
}
