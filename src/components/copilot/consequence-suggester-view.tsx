"use client";

import { useState } from "react";
import { Shuffle } from "lucide-react";

import { generateConsequenceSuggestions, type EntityPool, type GeneratedConsequence } from "@/modules/copilot/consequence-suggester/generator";
import { CONSEQUENCE_CATEGORY_LABELS } from "@/modules/copilot/consequence-suggester/templates";
import type { ConsequenceFormState } from "@/modules/preparation/consequences/actions";
import type { TagOption } from "@/components/wiki/tag-picker";
import { ConsequenceForm } from "@/components/consequences/consequence-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ConsequenceSuggesterViewProps {
  campaignId: string;
  pool: EntityPool;
  tags: TagOption[];
  action: (state: ConsequenceFormState, formData: FormData) => Promise<ConsequenceFormState>;
}

const COUNT_OPTIONS = ["3", "5", "8", "12"];
const TITLE_MAX = 90;

function deriveTitle(text: string): string {
  return text.length > TITLE_MAX ? `${text.slice(0, TITLE_MAX).trimEnd()}…` : text;
}

/**
 * Client component só para a geração em si (`generateConsequenceSuggestions`
 * é pura, roda inteiramente no navegador — sem round-trip ao servidor a cada
 * "Sugerir novamente", mesma filosofia zero-custo do resto da fase). O pool
 * de entidades reais é buscado uma vez pela página (Server Component) e
 * passado como prop; salvar uma sugestão reaproveita `ConsequenceForm` +
 * `createConsequenceAction` tal como existem, sem duplicar lógica de criação.
 */
export function ConsequenceSuggesterView({ campaignId, pool, tags, action }: ConsequenceSuggesterViewProps) {
  const [count, setCount] = useState("5");
  const [suggestions, setSuggestions] = useState<GeneratedConsequence[]>([]);
  const [selected, setSelected] = useState<GeneratedConsequence | null>(null);

  function handleGenerate() {
    setSuggestions(generateConsequenceSuggestions(pool, Number(count)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="suggestion-count">Quantas sugestões?</Label>
          <Select value={count} onValueChange={setCount}>
            <SelectTrigger id="suggestion-count" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNT_OPTIONS.map((n) => (
                <SelectItem key={n} value={n}>
                  {n} sugestões
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" onClick={handleGenerate}>
          <Shuffle className="size-4" /> Sugerir consequências
        </Button>
      </div>

      {suggestions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Clique em &ldquo;Sugerir consequências&rdquo; para sortear algumas ideias.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <Card>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Badge variant="secondary">{CONSEQUENCE_CATEGORY_LABELS[suggestion.category]}</Badge>
                    <p className="text-sm">{suggestion.text}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelected(suggestion)}>
                    Usar esta sugestão
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar como consequência</DialogTitle>
            <DialogDescription>Revise o texto antes de salvar — tudo aqui é editável.</DialogDescription>
          </DialogHeader>
          {selected && (
            <ConsequenceForm
              campaignId={campaignId}
              action={action}
              submitLabel="Salvar consequência"
              availableTags={tags}
              defaultValues={{
                title: deriveTitle(selected.text),
                description: selected.text,
                status: "PENDING",
                visibility: "GM_ONLY",
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
