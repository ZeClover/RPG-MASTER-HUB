"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import type { RelatableEntityType } from "@/generated/prisma/client";
import { createRelationshipAction } from "@/modules/creation/relationships/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RelationshipTargetPicker } from "@/components/wiki/relationship-target-picker";
import { RelationshipTypeField } from "@/components/wiki/relationship-type-field";
import { VisibilityField } from "@/components/wiki/visibility-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddRelationshipDialogProps {
  campaignId: string;
  sourceType: RelatableEntityType;
  sourceId: string;
}

export function AddRelationshipDialog({ campaignId, sourceType, sourceId }: AddRelationshipDialogProps) {
  const [open, setOpen] = useState(false);
  const action = createRelationshipAction.bind(null, campaignId, sourceType, sourceId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setOpen(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="size-3.5" /> Adicionar relação
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova relação</DialogTitle>
          <DialogDescription>A relação parte desta entidade em direção à que você escolher.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <RelationshipTypeField />
          <RelationshipTargetPicker campaignId={campaignId} excludeType={sourceType} excludeId={sourceId} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea id="description" name="description" rows={2} placeholder="Algum detalhe sobre essa relação?" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="importance">Importância</Label>
              <Select name="importance" defaultValue="">
                <SelectTrigger id="importance">
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baixa</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <VisibilityField />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
