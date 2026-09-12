import Link from "next/link";

import type { ContradictionRelation, ContradictionRow } from "@/modules/copilot/lore-guardian/queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ContradictionListProps {
  rows: ContradictionRow[];
  emptyMessage: string;
}

function RelationLine({ relation }: { relation: ContradictionRelation }) {
  return (
    <p className="text-sm">
      <Link href={relation.source.href} className="font-medium hover:underline">
        {relation.source.name}
      </Link>{" "}
      <span className="text-muted-foreground">&ldquo;{relation.type}&rdquo;</span>{" "}
      <Link href={relation.target.href} className="font-medium hover:underline">
        {relation.target.name}
      </Link>
      {relation.description && <span className="block text-xs text-muted-foreground">{relation.description}</span>}
    </p>
  );
}

export function ContradictionList({ rows, emptyMessage }: ContradictionListProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row, index) => (
        <li key={`${row.relationA.id}-${row.relationB.id}-${index}`}>
          <Card>
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="flex items-center gap-2">
                <Badge variant="warning">Possível contradição</Badge>
                <span className="text-xs text-muted-foreground">
                  palavras-chave &ldquo;{row.matchedKeywords[0]}&rdquo; vs. &ldquo;{row.matchedKeywords[1]}&rdquo;
                </span>
              </div>
              <RelationLine relation={row.relationA} />
              <RelationLine relation={row.relationB} />
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
