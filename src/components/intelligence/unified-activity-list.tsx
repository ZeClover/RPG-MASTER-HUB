import Link from "next/link";

import type { UnifiedActivityItem } from "@/modules/intelligence/brain/queries";
import { CONTENT_TYPE_ICONS, CONTENT_TYPE_LABELS } from "@/modules/intelligence/content-types";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/format";

export function UnifiedActivityList({ items }: { items: UnifiedActivityItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nada foi criado ou editado ainda nesta campanha.</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = CONTENT_TYPE_ICONS[item.type];
        return (
          <li key={`${item.type}-${item.id}`}>
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-surface-elevated"
            >
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
              <Badge variant="outline" className="shrink-0">
                {CONTENT_TYPE_LABELS[item.type]}
              </Badge>
              <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
                {formatRelativeTime(item.updatedAt)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
