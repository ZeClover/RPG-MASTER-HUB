"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";

import { createTagAction } from "@/modules/creation/tags/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface TagOption {
  id: string;
  name: string;
  color: string | null;
}

interface TagPickerProps {
  campaignId: string;
  availableTags: TagOption[];
  defaultSelectedTagIds?: string[];
  name?: string;
}

/**
 * Seletor de tags com criação na hora: ao digitar um nome que não existe
 * ainda, cria a tag imediatamente (Server Action) e já a seleciona — assim,
 * quando o formulário pai for enviado, todas as tags escolhidas já existem
 * de verdade no banco.
 */
export function TagPicker({ campaignId, availableTags, defaultSelectedTagIds = [], name = "tagIds" }: TagPickerProps) {
  const [tags, setTags] = useState(availableTags);
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultSelectedTagIds);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = tags.filter(
    (tag) => !selectedIds.includes(tag.id) && tag.name.toLowerCase().includes(normalizedQuery),
  );
  const exactMatch = tags.some((tag) => tag.name.toLowerCase() === normalizedQuery);
  const selectedTags = tags.filter((tag) => selectedIds.includes(tag.id));

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]));
  }

  function handleCreate() {
    const trimmed = query.trim();
    if (!trimmed) return;

    startTransition(async () => {
      const result = await createTagAction(campaignId, trimmed);
      if (result?.tag) {
        setTags((prev) => (prev.some((tag) => tag.id === result.tag.id) ? prev : [...prev, result.tag]));
        setSelectedIds((prev) => (prev.includes(result.tag.id) ? prev : [...prev, result.tag.id]));
        setQuery("");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>Tags</Label>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
              className="gap-1 border"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => toggle(tag.id)}
                className="opacity-60 transition-opacity hover:opacity-100"
              >
                <X className="size-3" />
                <span className="sr-only">Remover tag {tag.name}</span>
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="w-fit">
            <Plus className="size-3.5" /> Adicionar tag
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar ou criar tag…"
            className="mb-2"
          />
          <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
            {filtered.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => {
                  toggle(tag.id);
                  setQuery("");
                }}
                className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface"
              >
                {tag.name}
              </button>
            ))}
            {query.trim() && !exactMatch && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleCreate}
                className="rounded-md px-2 py-1.5 text-left text-sm text-primary hover:bg-surface disabled:opacity-50"
              >
                {isPending ? "Criando…" : `Criar tag "${query.trim()}"`}
              </button>
            )}
            {filtered.length === 0 && !query.trim() && (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">Digite para buscar ou criar uma tag.</p>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedIds.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </div>
  );
}
