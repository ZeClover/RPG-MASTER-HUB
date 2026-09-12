"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Star, Trash2 } from "lucide-react";

import type { Scene } from "@/generated/prisma/client";
import {
  deleteSceneAction,
  toggleSceneFavoriteAction,
  updateSceneAction,
} from "@/modules/preparation/session-plans/scene-actions";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SCENE_STATUS_OPTIONS } from "@/components/wiki/status-config";
import { cn } from "@/lib/utils";

interface SceneEditDialogProps {
  scene: Scene;
  campaignId: string;
  sessionPlanId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SceneEditDialog({ scene, campaignId, sessionPlanId, open, onOpenChange }: SceneEditDialogProps) {
  const action = updateSceneAction.bind(null, campaignId, sessionPlanId, scene.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isTogglingFavorite, startFavoriteTransition] = useTransition();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.errors) {
      onOpenChange(false);
    }
    wasPending.current = pending;
  }, [pending, state, onOpenChange]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cena</DialogTitle>
          </DialogHeader>

          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="scene-title">Título</Label>
              <Input id="scene-title" name="title" defaultValue={scene.title} required />
              {state?.errors?.title && <p className="text-xs text-destructive">{state.errors.title[0]}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="scene-goal">Objetivo da cena</Label>
              <Input id="scene-goal" name="goal" defaultValue={scene.goal ?? ""} placeholder="O que precisa acontecer aqui?" />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="scene-summary">Resumo</Label>
              <Textarea id="scene-summary" name="summary" rows={3} defaultValue={scene.summary ?? ""} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="scene-read-aloud">Texto para ler em voz alta</Label>
              <Textarea id="scene-read-aloud" name="readAloud" rows={3} defaultValue={scene.readAloud ?? ""} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="scene-status">Status</Label>
              <Select name="status" defaultValue={scene.status}>
                <SelectTrigger id="scene-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCENE_STATUS_OPTIONS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="flex-row items-center justify-between sm:justify-between">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isTogglingFavorite}
                  onClick={() =>
                    startFavoriteTransition(() => toggleSceneFavoriteAction(campaignId, sessionPlanId, scene.id))
                  }
                >
                  <Star className={cn("size-4", scene.favorite ? "fill-accent text-accent" : "text-muted-foreground")} />
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
        title={`Excluir a cena "${scene.title}"?`}
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={async () => {
          await deleteSceneAction(campaignId, sessionPlanId, scene.id);
          onOpenChange(false);
        }}
      />
    </>
  );
}
