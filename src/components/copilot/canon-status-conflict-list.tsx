import Link from "next/link";

import type { CanonStatusConflictRow } from "@/modules/copilot/canon-checker/queries";
import { ENTITY_TYPE_ICONS, ENTITY_TYPE_LABELS } from "@/modules/creation/relationships/config";
import { CanonStatusBadge } from "@/components/wiki/canon-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CanonStatusConflictListProps {
  rows: CanonStatusConflictRow[];
  emptyMessage: string;
}

export function CanonStatusConflictList({ rows, emptyMessage }: CanonStatusConflictListProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => {
        const CanonIcon = ENTITY_TYPE_ICONS[row.canonEntity.type];
        const OutdatedIcon = ENTITY_TYPE_ICONS[row.outdatedEntity.type];
        return (
          <li key={row.relation.id}>
            <Card>
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="warning">Status canônico incompatível</Badge>
                  <span className="text-xs text-muted-foreground">
                    relacionamento &ldquo;{row.relation.type}&rdquo;
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-sm">
                  <Link href={row.canonEntity.href} className="inline-flex items-center gap-1.5 font-medium hover:underline">
                    <CanonIcon className="size-3.5 text-muted-foreground" /> {row.canonEntity.name}
                  </Link>
                  <Badge variant="outline">{ENTITY_TYPE_LABELS[row.canonEntity.type]}</Badge>
                  <CanonStatusBadge status={row.canonEntity.canonStatus} />
                  <span className="text-muted-foreground">está relacionado a</span>
                  <Link
                    href={row.outdatedEntity.href}
                    className="inline-flex items-center gap-1.5 font-medium hover:underline"
                  >
                    <OutdatedIcon className="size-3.5 text-muted-foreground" /> {row.outdatedEntity.name}
                  </Link>
                  <Badge variant="outline">{ENTITY_TYPE_LABELS[row.outdatedEntity.type]}</Badge>
                  <CanonStatusBadge status={row.outdatedEntity.canonStatus} />
                </div>
                {row.relation.description && (
                  <p className="text-xs text-muted-foreground">{row.relation.description}</p>
                )}
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
