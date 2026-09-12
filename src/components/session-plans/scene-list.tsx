"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Plus, Star } from "lucide-react";

import type { Scene } from "@/generated/prisma/client";
import { createSceneAction, moveSceneAction } from "@/modules/preparation/session-plans/scene-actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SCENE_STATUS_BADGE_VARIANT, SCENE_STATUS_LABELS } from "@/components/wiki/status-config";
import { SceneEditDialog } from "@/components/session-plans/scene-edit-dialog";

function SceneRow({
  scene,
  campaignId,
  sessionPlanId,
  isFirst,
  isLast,
}: {
  scene: Scene;
  campaignId: string;
  sessionPlanId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [isMoving, startMoveTransition] = useTransition();

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={() => setEditOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") setEditOpen(true);
        }}
        className="flex cursor-pointer items-start justify-between gap-3 p-3 transition-colors hover:border-primary/50"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate text-sm font-semibold">{scene.title}</h4>
            {scene.favorite && <Star className="size-3.5 shrink-0 fill-accent text-accent" />}
          </div>
          {scene.goal && <p className="truncate text-xs text-muted-foreground">{scene.goal}</p>}
          <Badge variant={SCENE_STATUS_BADGE_VARIANT[scene.status]} className="mt-1.5">
            {SCENE_STATUS_LABELS[scene.status]}
          </Badge>
        </div>
        <div className="flex shrink-0 flex-col" onClick={(event) => event.stopPropagation()}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isFirst || isMoving}
            onClick={() => startMoveTransition(() => moveSceneAction(campaignId, sessionPlanId, scene.id, "up"))}
          >
            <ChevronUp className="size-4" />
            <span className="sr-only">Mover para cima</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isLast || isMoving}
            onClick={() => startMoveTransition(() => moveSceneAction(campaignId, sessionPlanId, scene.id, "down"))}
          >
            <ChevronDown className="size-4" />
            <span className="sr-only">Mover para baixo</span>
          </Button>
        </div>
      </Card>

      <SceneEditDialog
        scene={scene}
        campaignId={campaignId}
        sessionPlanId={sessionPlanId}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

function QuickAddSceneForm({ campaignId, sessionPlanId }: { campaignId: string; sessionPlanId: string }) {
  const action = createSceneAction.bind(null, campaignId, sessionPlanId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.errors) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="status" value="PLANNED" />
      <div className="flex gap-2">
        <Input name="title" placeholder="Nova cena…" className="flex-1" autoComplete="off" />
        <Button type="submit" disabled={pending}>
          <Plus className="size-4" /> {pending ? "Salvando…" : "Adicionar"}
        </Button>
      </div>
      {state?.errors?.title && <p className="text-xs text-destructive">{state.errors.title[0]}</p>}
    </form>
  );
}

export function SceneList({
  scenes,
  campaignId,
  sessionPlanId,
}: {
  scenes: Scene[];
  campaignId: string;
  sessionPlanId: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {scenes.map((scene, index) => (
        <SceneRow
          key={scene.id}
          scene={scene}
          campaignId={campaignId}
          sessionPlanId={sessionPlanId}
          isFirst={index === 0}
          isLast={index === scenes.length - 1}
        />
      ))}
      <QuickAddSceneForm campaignId={campaignId} sessionPlanId={sessionPlanId} />
    </div>
  );
}
