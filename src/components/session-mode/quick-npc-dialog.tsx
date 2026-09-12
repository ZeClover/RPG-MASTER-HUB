"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Users } from "lucide-react";

import { quickCreateNpcAction } from "@/modules/creation/npcs/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface QuickNpcDialogProps {
  campaignId: string;
  onCreated?: (npc: { id: string; name: string }) => void;
}

export function QuickNpcDialog({ campaignId, onCreated }: QuickNpcDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setName("");
      setNote("");
      setError(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await quickCreateNpcAction(campaignId, name, note || undefined);
      if (result.error || !result.npc) {
        setError(result.error ?? "Não foi possível criar o NPC.");
        return;
      }
      setName("");
      setNote("");
      setError(null);
      setOpen(false);
      onCreated?.(result.npc);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button">
          <Users className="size-4" /> NPC rápido
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>NPC rápido</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="quick-npc-name">Nome</Label>
            <Input
              id="quick-npc-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              required
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="quick-npc-note">Nota (opcional)</Label>
            <Textarea
              id="quick-npc-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="O que ele faz? Como se chama a loja dele?"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Criando…" : "Criar NPC"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
