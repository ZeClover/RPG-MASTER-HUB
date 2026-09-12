"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, Dices, Star, Trash2 } from "lucide-react";

import type { RollTableKind } from "@/generated/prisma/client";
import {
  deleteRollTableAction,
  toggleRollTableArchivedAction,
  toggleRollTableFavoriteAction,
} from "@/modules/gametools/roll-tables/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

interface RollTableCardProps {
  campaignId: string;
  kind: RollTableKind;
  basePath: string;
  table: {
    id: string;
    name: string;
    description: string | null;
    favorite: boolean;
    archived: boolean;
    _count: { entries: number };
  };
}

export function RollTableCard({ campaignId, kind, basePath, table }: RollTableCardProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <Card className="relative flex flex-col gap-3 p-4">
      <Link href={`${basePath}/${table.id}`} className="absolute inset-0 z-0" aria-label={`Abrir ${table.name}`} />

      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Dices className="size-4 shrink-0 text-muted-foreground" />
          <h3 className="truncate text-sm font-semibold">{table.name}</h3>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => toggleRollTableFavoriteAction(campaignId, kind, table.id))}
          className="relative z-10 shrink-0 rounded p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100"
          aria-label={table.favorite ? "Remover dos favoritos" : "Favoritar"}
        >
          <Star className={cn("size-4", table.favorite && "fill-accent text-accent")} />
        </button>
      </div>

      {table.description ? <p className="line-clamp-2 text-xs text-muted-foreground">{table.description}</p> : null}

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {table._count.entries} {table._count.entries === 1 ? "entrada" : "entradas"}
        </span>
        <div className="relative z-10 flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isPending}
            onClick={() => startTransition(() => toggleRollTableArchivedAction(campaignId, kind, table.id))}
          >
            {table.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
            <span className="sr-only">{table.archived ? "Desarquivar" : "Arquivar"}</span>
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4 text-destructive" />
            <span className="sr-only">Excluir</span>
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Excluir "${table.name}"?`}
        description="Esta ação não pode ser desfeita. Todas as entradas desta tabela também serão removidas."
        confirmLabel="Excluir"
        onConfirm={() => deleteRollTableAction(campaignId, kind, table.id)}
      />
    </Card>
  );
}
