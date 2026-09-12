import Link from "next/link";

import type { DuplicateNameRow } from "@/modules/copilot/lore-guardian/queries";
import { ENTITY_TYPE_ICONS, ENTITY_TYPE_LABELS } from "@/modules/creation/relationships/config";
import { Badge } from "@/components/ui/badge";

interface DuplicateNamesListProps {
  rows: DuplicateNameRow[];
  emptyMessage: string;
}

export function DuplicateNamesList({ rows, emptyMessage }: DuplicateNamesListProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row, index) => {
        const IconA = ENTITY_TYPE_ICONS[row.a.type];
        const IconB = ENTITY_TYPE_ICONS[row.b.type];
        return (
          <li
            key={`${row.a.type}-${row.a.id}-${row.b.type}-${row.b.id}-${index}`}
            className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
          >
            <Badge variant={row.kind === "EXACT" ? "destructive" : "warning"}>
              {row.kind === "EXACT" ? "Nome idêntico" : "Nome parecido"}
            </Badge>
            <Link href={row.a.href} className="inline-flex items-center gap-1.5 font-medium hover:underline">
              <IconA className="size-3.5 text-muted-foreground" /> {row.a.name}
            </Link>
            <Badge variant="outline">{ENTITY_TYPE_LABELS[row.a.type]}</Badge>
            <span className="text-muted-foreground">×</span>
            <Link href={row.b.href} className="inline-flex items-center gap-1.5 font-medium hover:underline">
              <IconB className="size-3.5 text-muted-foreground" /> {row.b.name}
            </Link>
            <Badge variant="outline">{ENTITY_TYPE_LABELS[row.b.type]}</Badge>
          </li>
        );
      })}
    </ul>
  );
}
