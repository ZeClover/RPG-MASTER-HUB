import Link from "next/link";

import type { ActiveReferencingOutdatedRow } from "@/modules/copilot/canon-checker/queries";
import { ENTITY_TYPE_ICONS, ENTITY_TYPE_LABELS } from "@/modules/creation/relationships/config";
import { CanonStatusBadge } from "@/components/wiki/canon-status-badge";
import { QUEST_STATUS_LABELS, PLOT_THREAD_STATUS_LABELS } from "@/components/wiki/status-config";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ActiveReferencingOutdatedListProps {
  rows: ActiveReferencingOutdatedRow[];
  emptyMessage: string;
}

function activeStatusLabel(row: ActiveReferencingOutdatedRow["activeEntity"]): string {
  return row.type === "QUEST"
    ? QUEST_STATUS_LABELS[row.status as keyof typeof QUEST_STATUS_LABELS]
    : PLOT_THREAD_STATUS_LABELS[row.status as keyof typeof PLOT_THREAD_STATUS_LABELS];
}

export function ActiveReferencingOutdatedList({ rows, emptyMessage }: ActiveReferencingOutdatedListProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => {
        const ActiveIcon = ENTITY_TYPE_ICONS[row.activeEntity.type];
        const OutdatedIcon = ENTITY_TYPE_ICONS[row.outdatedEntity.type];
        return (
          <li key={row.relation.id}>
            <Card>
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="warning">Ativo referenciando conteúdo desatualizado</Badge>
                  <span className="text-xs text-muted-foreground">
                    relacionamento &ldquo;{row.relation.type}&rdquo;
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-sm">
                  <Link
                    href={row.activeEntity.href}
                    className="inline-flex items-center gap-1.5 font-medium hover:underline"
                  >
                    <ActiveIcon className="size-3.5 text-muted-foreground" /> {row.activeEntity.name}
                  </Link>
                  <Badge variant="outline">{ENTITY_TYPE_LABELS[row.activeEntity.type]}</Badge>
                  <Badge variant="secondary">{activeStatusLabel(row.activeEntity)}</Badge>
                  <span className="text-muted-foreground">referencia</span>
                  <Link
                    href={row.outdatedEntity.href}
                    className="inline-flex items-center gap-1.5 font-medium hover:underline"
                  >
                    <OutdatedIcon className="size-3.5 text-muted-foreground" /> {row.outdatedEntity.name}
                  </Link>
                  <Badge variant="outline">{ENTITY_TYPE_LABELS[row.outdatedEntity.type]}</Badge>
                  {row.outdatedEntity.archived && <Badge variant="destructive">Arquivado</Badge>}
                  {row.outdatedEntity.canonStatus && <CanonStatusBadge status={row.outdatedEntity.canonStatus} />}
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
