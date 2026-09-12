import Link from "next/link";
import { Clapperboard, NotebookText, History, ShieldAlert, type LucideIcon } from "lucide-react";

import type { RecallItem, RecallItemKind } from "@/modules/copilot/campaign-recall/queries";
import { formatDateTime } from "@/lib/format";

const KIND_ICONS: Record<RecallItemKind, LucideIcon> = {
  SCENE: Clapperboard,
  LOG_ENTRY: NotebookText,
  TIMELINE_EVENT: History,
  CONSEQUENCE: ShieldAlert,
};

interface RecallTimelineProps {
  items: RecallItem[];
  emptyMessage: string;
}

export function RecallTimeline({ items, emptyMessage }: RecallTimelineProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ol className="flex flex-col gap-4">
      {items.map((item, index) => {
        const Icon = KIND_ICONS[item.kind];
        return (
          <li key={index} className="flex gap-3">
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-muted-foreground">{formatDateTime(item.at)}</p>
              <p className="text-sm">
                <span className="font-medium">{item.label}</span>
                {item.title &&
                  (item.href ? (
                    <>
                      : <Link href={item.href} className="font-medium hover:underline">{item.title}</Link>
                    </>
                  ) : (
                    <>: &ldquo;{item.title}&rdquo;</>
                  ))}
                {item.body && <span className="text-muted-foreground"> — {item.body}</span>}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
