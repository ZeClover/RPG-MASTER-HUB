"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface WikiListToolbarProps {
  tags: { id: string; name: string; slug: string; color: string | null }[];
  statusOptions: [string, string][];
  statusParam?: string;
  statusLabel?: string;
  searchPlaceholder?: string;
}

/** Barra de busca/filtros para as listas de NPCs, Locais, Facções, Lore e Ideias — estado vive na URL. */
export function WikiListToolbar({
  tags,
  statusOptions,
  statusParam = "status",
  statusLabel = "Status",
  searchPlaceholder = "Buscar…",
}: WikiListToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeTag = searchParams.get("tag") ?? "";
  const status = searchParams.get(statusParam) ?? "";
  const favorite = searchParams.get("favorite") === "1";
  const archived = searchParams.get("archived") === "1";

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  function handleSearchChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParams({ q: value }), 350);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8"
          />
        </div>

        <Select
          value={status || "__all__"}
          onValueChange={(value) => updateParams({ [statusParam]: value === "__all__" ? null : value })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder={statusLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos os status</SelectItem>
            {statusOptions.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant={favorite ? "default" : "outline"}
          size="sm"
          onClick={() => updateParams({ favorite: favorite ? null : "1" })}
        >
          Favoritos
        </Button>
        <Button
          type="button"
          variant={archived ? "default" : "outline"}
          size="sm"
          onClick={() => updateParams({ archived: archived ? null : "1" })}
        >
          Arquivados
        </Button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => updateParams({ tag: activeTag === tag.slug ? null : tag.slug })}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                activeTag === tag.slug
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:bg-surface-elevated",
              )}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
