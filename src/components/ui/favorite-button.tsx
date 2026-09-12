"use client";

import { useTransition } from "react";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  favorite: boolean;
  action: () => Promise<void>;
}

export function FavoriteButton({ favorite, action }: FavoriteButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isPending}
          aria-pressed={favorite}
          onClick={() => startTransition(() => action())}
        >
          <Star className={cn("size-4", favorite ? "fill-accent text-accent" : "text-muted-foreground")} />
          <span className="sr-only">{favorite ? "Remover dos favoritos" : "Favoritar"}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{favorite ? "Remover dos favoritos" : "Favoritar"}</TooltipContent>
    </Tooltip>
  );
}
