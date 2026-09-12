"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Star } from "lucide-react";

import type { TimelineEvent } from "@/generated/prisma/client";
import { moveTimelineEventAction } from "@/modules/worldbuilding/timeline/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";

interface TimelineListProps {
  campaignId: string;
  events: TimelineEvent[];
}

function TimelineEventRow({
  campaignId,
  event,
  isFirst,
  isLast,
}: {
  campaignId: string;
  event: TimelineEvent;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isMoving, startMoveTransition] = useTransition();

  return (
    <li className="relative pb-4 pl-6 last:pb-0">
      <span className="absolute top-4 left-[3px] h-[calc(100%-1rem)] w-px bg-border last:hidden" aria-hidden />
      <span className="absolute top-4 left-0 size-2 rounded-full border-2 border-primary bg-surface" aria-hidden />

      <Card className="flex items-start justify-between gap-3 p-3">
        <Link href={`/campaigns/${campaignId}/timeline/${event.id}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate text-sm font-semibold">{event.title}</h4>
            {event.favorite && <Star className="size-3.5 shrink-0 fill-accent text-accent" />}
          </div>
          {event.narrativeDate && <p className="text-xs font-medium text-primary">{event.narrativeDate}</p>}
          {event.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{event.description}</p>}
          <div className="mt-1.5">
            <VisibilityBadge visibility={event.visibility} />
          </div>
        </Link>
        <div className="flex shrink-0 flex-col">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isFirst || isMoving}
            onClick={() => startMoveTransition(() => moveTimelineEventAction(campaignId, event.id, "up"))}
          >
            <ChevronUp className="size-4" />
            <span className="sr-only">Mover para cima</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isLast || isMoving}
            onClick={() => startMoveTransition(() => moveTimelineEventAction(campaignId, event.id, "down"))}
          >
            <ChevronDown className="size-4" />
            <span className="sr-only">Mover para baixo</span>
          </Button>
        </div>
      </Card>
    </li>
  );
}

/** Lista cronológica renderizada como linha do tempo vertical simples (borda + marcador), sem biblioteca de gráficos. */
export function TimelineList({ campaignId, events }: TimelineListProps) {
  return (
    <ol className="flex flex-col">
      {events.map((event, index) => (
        <TimelineEventRow
          key={event.id}
          campaignId={campaignId}
          event={event}
          isFirst={index === 0}
          isLast={index === events.length - 1}
        />
      ))}
    </ol>
  );
}
