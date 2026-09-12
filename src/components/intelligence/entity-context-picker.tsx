"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import type { RelatableEntityType } from "@/generated/prisma/client";
import { searchRelatableEntitiesAction } from "@/modules/creation/relationships/actions";
import { ENTITY_TYPE_OPTIONS } from "@/modules/creation/relationships/config";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EntityOption {
  id: string;
  name: string;
  imageUrl: string | null;
  archived: boolean;
}

/**
 * Escolhe tipo + entidade (reaproveita `searchRelatableEntitiesAction`, a
 * mesma busca por trás do seletor de alvo de Relacionamentos) e navega direto
 * para o raio-x dela — sem um formulário para submeter, é só um roteador.
 */
export function EntityContextPicker({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [type, setType] = useState<RelatableEntityType>("NPC");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EntityOption[]>([]);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function runSearch(nextType: RelatableEntityType, nextQuery: string) {
    startTransition(async () => {
      const rows = await searchRelatableEntitiesAction(campaignId, nextType, nextQuery);
      setResults(rows);
    });
  }

  useEffect(() => {
    runSearch(type, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só dispara na troca de tipo, busca por texto usa debounce próprio
  }, [type]);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(type, value), 300);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Select value={type} onValueChange={(value) => setType(value as RelatableEntityType)}>
          <SelectTrigger className="w-40 shrink-0">
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
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder="Buscar entidade…"
            className="pl-9"
            autoFocus
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {isPending && <p className="px-2 py-1.5 text-sm text-muted-foreground">Buscando…</p>}
        {!isPending && results.length === 0 && (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">Nada encontrado.</p>
        )}
        {!isPending &&
          results.map((entity) => (
            <button
              key={entity.id}
              type="button"
              onClick={() => router.push(`/campaigns/${campaignId}/context/${type}/${entity.id}`)}
              className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-surface-elevated"
            >
              <span className="truncate">{entity.name}</span>
              {entity.archived && <span className="shrink-0 text-xs text-muted-foreground">(arquivado)</span>}
            </button>
          ))}
      </div>
    </div>
  );
}
