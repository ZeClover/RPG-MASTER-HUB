"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Plus, Users, X } from "lucide-react";

import type { Clue, RelatableEntityType } from "@/generated/prisma/client";
import {
  addClueAction,
  deleteClueAction,
  toggleClueDiscoveredAction,
  toggleClueSharedAction,
} from "@/modules/worldbuilding/mysteries/clue-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ClueEntityLink } from "@/components/mysteries/clue-entity-link";

interface LinkedEntitiesMap {
  [key: string]: { type: RelatableEntityType; id: string; name: string };
}

function ClueRow({
  clue,
  campaignId,
  mysteryId,
  linkedEntitiesByKey,
  canManage,
}: {
  clue: Clue;
  campaignId: string;
  mysteryId: string;
  linkedEntitiesByKey: LinkedEntitiesMap;
  canManage: boolean;
}) {
  const [isToggling, startToggleTransition] = useTransition();
  const [isSharing, startShareTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const linked =
    clue.linkedEntityType && clue.linkedEntityId
      ? (linkedEntitiesByKey[`${clue.linkedEntityType}:${clue.linkedEntityId}`] ?? null)
      : null;

  return (
    <li className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
      <input
        type="checkbox"
        checked={clue.discovered}
        disabled={isToggling || !canManage}
        onChange={() => startToggleTransition(() => toggleClueDiscoveredAction(campaignId, mysteryId, clue.id))}
        className="size-4 shrink-0 accent-primary"
        aria-label="Descoberta"
      />
      <span className={cn("min-w-0 flex-1", clue.discovered && "text-muted-foreground line-through")}>
        {clue.text}
      </span>
      {canManage && (
        <button
          type="button"
          disabled={isSharing}
          onClick={() => startShareTransition(() => toggleClueSharedAction(campaignId, mysteryId, clue.id))}
          className={cn(
            "shrink-0 rounded p-1 transition-colors",
            clue.sharedWithPlayers
              ? "text-primary hover:bg-primary/10"
              : "text-muted-foreground opacity-60 hover:bg-surface-elevated hover:opacity-100",
          )}
          title={clue.sharedWithPlayers ? "Compartilhada com os jogadores — clique para ocultar" : "Compartilhar com os jogadores"}
          aria-label={clue.sharedWithPlayers ? "Ocultar dos jogadores" : "Compartilhar com os jogadores"}
        >
          <Users className="size-3.5" />
        </button>
      )}
      <ClueEntityLink campaignId={campaignId} mysteryId={mysteryId} clueId={clue.id} linked={linked} />
      {canManage && (
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => startDeleteTransition(() => deleteClueAction(campaignId, mysteryId, clue.id))}
          className="shrink-0 rounded p-1 text-muted-foreground opacity-60 transition-opacity hover:bg-surface-elevated hover:opacity-100"
          aria-label="Remover pista"
        >
          <X className="size-3.5" />
        </button>
      )}
    </li>
  );
}

function AddClueForm({ campaignId, mysteryId }: { campaignId: string; mysteryId: string }) {
  const action = addClueAction.bind(null, campaignId, mysteryId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input name="text" placeholder="Nova pista…" className="flex-1" autoComplete="off" />
        <Button type="submit" variant="outline" disabled={pending}>
          <Plus className="size-4" /> {pending ? "Salvando…" : "Adicionar"}
        </Button>
      </div>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}

export function ClueList({
  clues,
  campaignId,
  mysteryId,
  linkedEntitiesByKey,
  canManage = true,
}: {
  clues: Clue[];
  campaignId: string;
  mysteryId: string;
  linkedEntitiesByKey: LinkedEntitiesMap;
  canManage?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {clues.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {clues.map((clue) => (
            <ClueRow
              key={clue.id}
              clue={clue}
              campaignId={campaignId}
              mysteryId={mysteryId}
              linkedEntitiesByKey={linkedEntitiesByKey}
              canManage={canManage}
            />
          ))}
        </ul>
      ) : (
        !canManage && <p className="text-sm text-muted-foreground">Nenhuma pista compartilhada com os jogadores ainda.</p>
      )}
      {canManage && <AddClueForm campaignId={campaignId} mysteryId={mysteryId} />}
    </div>
  );
}
