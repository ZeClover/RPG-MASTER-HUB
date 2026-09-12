"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, MoreVertical, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ToggleMenuItem } from "@/components/ui/toggle-menu-item";
import { FavoriteButton } from "@/components/ui/favorite-button";

interface EntityActionsMenuProps {
  editHref: string;
  favorite: boolean;
  archived: boolean;
  onToggleFavorite: () => Promise<void>;
  onToggleArchived: () => Promise<void>;
  onDelete: () => Promise<{ error?: string } | void>;
  deleteTitle: string;
  deleteDescription: ReactNode;
}

/**
 * Menu de ações padrão (favoritar, editar, arquivar, excluir) reaproveitado
 * pelas páginas de detalhe de NPC/Local/Facção/Lore/Ideia. O diálogo de
 * confirmação fica como irmão do DropdownMenu (não dentro dele) para não ser
 * desmontado quando o menu fecha ao selecionar "Excluir".
 */
export function EntityActionsMenu({
  editHref,
  favorite,
  archived,
  onToggleFavorite,
  onToggleArchived,
  onDelete,
  deleteTitle,
  deleteDescription,
}: EntityActionsMenuProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <FavoriteButton favorite={favorite} action={onToggleFavorite} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="size-4" />
            <span className="sr-only">Mais ações</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={editHref}>
              <Pencil className="size-4" /> Editar
            </Link>
          </DropdownMenuItem>
          <ToggleMenuItem
            icon={archived ? ArchiveRestore : Archive}
            label={archived ? "Desarquivar" : "Arquivar"}
            action={onToggleArchived}
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={deleteTitle}
        description={deleteDescription}
        confirmLabel="Excluir"
        onConfirm={onDelete}
      />
    </div>
  );
}
