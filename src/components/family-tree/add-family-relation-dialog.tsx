"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { createFamilyRelationAction } from "@/modules/worldbuilding/family-tree/actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FamilyNpcPicker } from "@/components/family-tree/family-npc-picker";

interface AddFamilyRelationDialogProps {
  campaignId: string;
  npcId: string;
  npcName: string;
}

export function AddFamilyRelationDialog({ campaignId, npcId, npcName }: AddFamilyRelationDialogProps) {
  const [open, setOpen] = useState(false);
  const action = createFamilyRelationAction.bind(null, campaignId, npcId);
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
          <Plus className="size-3.5" /> Adicionar parentesco
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo parentesco</DialogTitle>
          <DialogDescription>A relação parte de {npcName} em direção ao NPC que você escolher.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex flex-col gap-2">
            <Label htmlFor="perspective">{npcName}…</Label>
            <Select name="perspective" defaultValue="PARENT_OF_FORWARD">
              <SelectTrigger id="perspective">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PARENT_OF_FORWARD">é pai/mãe de</SelectItem>
                <SelectItem value="PARENT_OF_BACKWARD">é filho/filha de</SelectItem>
                <SelectItem value="SPOUSE_OF">é cônjuge de</SelectItem>
                <SelectItem value="SIBLING_OF">é irmão/irmã de</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <FamilyNpcPicker campaignId={campaignId} excludeId={npcId} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input id="notes" name="notes" placeholder="Algum detalhe sobre esse parentesco?" />
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
