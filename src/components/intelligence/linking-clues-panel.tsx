import Link from "next/link";
import { Search } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface LinkingClueRef {
  id: string;
  text: string;
  mysteryId: string;
  mysteryTitle: string;
  mysteryHref: string;
}

/**
 * Referência cruzada que não existe em NENHUM outro lugar do app hoje: uma
 * pista de Mistério que aponta para esta entidade não aparece na página da
 * própria entidade — só ao abrir o Mistério (ver ARCHITECTURE.md, seção
 * 18.2). É o principal motivo do Context Engine ser mais do que "a mesma
 * ficha de novo".
 */
export function LinkingCluesPanel({ clues }: { clues: LinkingClueRef[] }) {
  if (clues.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Search className="size-4 text-muted-foreground" />
        <CardTitle>Citada em Pistas de Mistério</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 pt-0">
        {clues.map((clue) => (
          <Link
            key={clue.id}
            href={clue.mysteryHref}
            className="flex flex-col gap-0.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-elevated"
          >
            <span className="truncate">{clue.text}</span>
            <span className="text-xs text-muted-foreground">em &ldquo;{clue.mysteryTitle}&rdquo;</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
