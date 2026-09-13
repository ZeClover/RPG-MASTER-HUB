"use client";

import { useTransition } from "react";
import { Eye } from "lucide-react";

import type { RelatableEntityType } from "@/generated/prisma/client";
import { revealToPlayersAction } from "@/modules/players/reveal/actions";
import { Button } from "@/components/ui/button";

/**
 * Player Knowledge (Fase 9): botão rápido para virar `GM_ONLY` → `PLAYERS`
 * sem abrir o formulário de edição — só aparece quando faz sentido (a
 * entidade ainda é GM_ONLY e quem está vendo pode gerenciar).
 */
export function RevealToPlayersButton({
  campaignId,
  entityType,
  entityId,
}: {
  campaignId: string;
  entityType: RelatableEntityType;
  entityId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => revealToPlayersAction(campaignId, entityType, entityId))}
    >
      <Eye className="size-3.5" /> {isPending ? "Revelando…" : "Revelar aos jogadores"}
    </Button>
  );
}
