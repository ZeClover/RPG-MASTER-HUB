import Link from "next/link";

import type { DashboardEntityRef } from "@/modules/core/dashboard/queries";
import { SEARCH_RESULT_ICONS } from "@/modules/core/search/config";
import { formatRelativeTime } from "@/lib/format";

export function EntityRefList({ items, emptyMessage }: { items: DashboardEntityRef[]; emptyMessage: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = SEARCH_RESULT_ICONS[item.type];
        return (
          <li key={`${item.type}-${item.id}`}>
            <Link
              href={item.href}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface-elevated"
            >
              <Icon className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(item.updatedAt)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
