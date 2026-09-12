"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Archive, ArchiveRestore, Star, Trash2 } from "lucide-react";

import type { IdeaState } from "@/generated/prisma/client";
import {
  deleteIdeaAction,
  toggleIdeaArchivedAction,
  toggleIdeaFavoriteAction,
  updateIdeaAction,
} from "@/modules/creation/ideas/actions";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagPicker, type TagOption } from "@/components/wiki/tag-picker";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IDEA_STATE_OPTIONS } from "@/components/wiki/status-config";
import { cn } from "@/lib/utils";

export interface IdeaSummary {
  id: string;
  title: string;
  content: string | null;
  state: IdeaState;
  favorite: boolean;
  archived: boolean;
  tags: { id: string; name: string; color: string | null }[];
}

interface IdeaEditDialogProps {
  idea: IdeaSummary;
  campaignId: string;
  availableTags: TagOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IdeaEditDialog({ idea, campaignId, availableTags, open, onOpenChange }: IdeaEditDialogProps) {
  const action = updateIdeaAction.bind(null, campaignId, idea.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isTogglingFavorite, startFavoriteTransition] = useTransition();
  const [isTogglingArchived, startArchiveTransition] = useTransition();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      onOpenChange(false);
    }
    wasPending.current = pending;
  }, [pending, onOpenChange]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar ideia</DialogTitle>
          </DialogHeader>

          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="idea-title">Título</Label>
              <Input id="idea-title" name="title" defaultValue={idea.title} required />
              {state?.errors?.title && <p className="text-xs text-destructive">{state.errors.title[0]}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="idea-content">Notas</Label>
              <Textarea id="idea-content" name="content" rows={4} defaultValue={idea.content ?? ""} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="idea-state">Estado</Label>
              <Select name="state" defaultValue={idea.state}>
                <SelectTrigger id="idea-state">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IDEA_STATE_OPTIONS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TagPicker
              campaignId={campaignId}
              availableTags={availableTags}
              defaultSelectedTagIds={idea.tags.map((tag) => tag.id)}
            />

            <DialogFooter className="flex-row items-center justify-between sm:justify-between">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isTogglingFavorite}
                  onClick={() => startFavoriteTransition(() => toggleIdeaFavoriteAction(campaignId, idea.id))}
                >
                  <Star className={cn("size-4", idea.favorite ? "fill-accent text-accent" : "text-muted-foreground")} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isTogglingArchived}
                  onClick={() => startArchiveTransition(() => toggleIdeaArchivedAction(campaignId, idea.id))}
                >
                  {idea.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Excluir "${idea.title}"?`}
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={async () => {
          await deleteIdeaAction(campaignId, idea.id);
          onOpenChange(false);
        }}
      />
    </>
  );
}
