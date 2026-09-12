import Link from "next/link";
import type { ReactNode } from "react";

import type { StaleContentRow } from "@/modules/intelligence/health/queries";
import { CONTENT_TYPE_ICONS, CONTENT_TYPE_LABELS } from "@/modules/intelligence/content-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/format";

interface HealthSectionProps {
  title: string;
  description: string;
  icon: ReactNode;
  rows: StaleContentRow[];
  emptyMessage: string;
}

export function HealthSection({ title, description, icon, rows, emptyMessage }: HealthSectionProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        {icon}
        <div className="flex-1">
          <CardTitle>
            {title} {rows.length > 0 && <span className="text-muted-foreground">({rows.length})</span>}
          </CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {rows.map((row) => {
              const Icon = CONTENT_TYPE_ICONS[row.type];
              return (
                <li key={`${row.type}-${row.id}`}>
                  <Link
                    href={row.href}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface-elevated"
                  >
                    <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{row.title}</span>
                    <Badge variant="outline" className="shrink-0">
                      {CONTENT_TYPE_LABELS[row.type]}
                    </Badge>
                    <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
                      {formatRelativeTime(row.updatedAt)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
