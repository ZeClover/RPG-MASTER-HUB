"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IDEA_STATE_BADGE_VARIANT, IDEA_STATE_LABELS } from "@/components/wiki/status-config";
import type { TagOption } from "@/components/wiki/tag-picker";
import { IdeaEditDialog, type IdeaSummary } from "@/components/ideas/idea-edit-dialog";

interface IdeaCardProps {
  idea: IdeaSummary;
  campaignId: string;
  availableTags: TagOption[];
}

export function IdeaCard({ idea, campaignId, availableTags }: IdeaCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") setOpen(true);
        }}
        className="flex cursor-pointer flex-col gap-2 p-4 transition-colors hover:border-primary/50"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 text-sm font-semibold">{idea.title}</h3>
          {idea.favorite && <Star className="size-3.5 shrink-0 fill-accent text-accent" />}
        </div>
        {idea.content && <p className="line-clamp-3 text-xs text-muted-foreground">{idea.content}</p>}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={IDEA_STATE_BADGE_VARIANT[idea.state]}>{IDEA_STATE_LABELS[idea.state]}</Badge>
          {idea.tags.slice(0, 3).map((tag) => (
            <Badge key={tag.id} variant="secondary" style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined} className="border">
              {tag.name}
            </Badge>
          ))}
        </div>
      </Card>

      <IdeaEditDialog idea={idea} campaignId={campaignId} availableTags={availableTags} open={open} onOpenChange={setOpen} />
    </>
  );
}
