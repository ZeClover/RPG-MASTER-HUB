"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArchiveRestore, Trash2 } from "lucide-react";

import type { GraveyardItem } from "@/modules/intelligence/graveyard/queries";
import { restoreArchivedContentAction, deleteArchivedContentPermanentlyAction } from "@/modules/intelligence/graveyard/actions";
import { CONTENT_TYPE_ICONS, CONTENT_TYPE_LABELS } from "@/modules/intelligence/content-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatRelativeTime } from "@/lib/format";

export function GraveyardItemRow({ campaignId, item }: { campaignId: string; item: GraveyardItem }) {
  const router = useRouter();
  const [isRestoring, startRestore] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const Icon = CONTENT_TYPE_ICONS[item.type];

  function handleRestore() {
    startRestore(async () => {
      await restoreArchivedContentAction(campaignId, item.type, item.id);
      // `toggle*ArchivedAction` só revalida a lista/detalhe daquela entidade — ela não
      // sabe que o Graveyard existe. `router.refresh()` força este Server Component a
      // buscar `listArchivedContent` de novo, senão o item restaurado "gruda" na lista.
      router.refresh();
    });
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <Link href={item.href} className="min-w-0 flex-1 hover:underline">
        <p className="truncate text-sm font-medium">{item.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.subtitle ? `${item.subtitle} · ` : ""}arquivado {formatRelativeTime(item.updatedAt)}
        </p>
      </Link>
      <Badge variant="outline" className="shrink-0">
        {CONTENT_TYPE_LABELS[item.type]}
      </Badge>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isRestoring}
            onClick={handleRestore}
          >
            <ArchiveRestore className="size-4" />
            <span className="sr-only">Desarquivar</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Desarquivar</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4 text-destructive" />
            <span className="sr-only">Excluir permanentemente</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Excluir permanentemente</TooltipContent>
      </Tooltip>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Excluir "${item.title}" permanentemente?`}
        description="Esta ação não pode ser desfeita. Relações com esta entidade também serão removidas. Você será levado para a lista deste tipo de conteúdo."
        confirmLabel="Excluir para sempre"
        onConfirm={() => deleteArchivedContentPermanentlyAction(campaignId, item.type, item.id)}
      />
    </li>
  );
}
