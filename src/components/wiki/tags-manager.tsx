"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";

import { deleteTagAction, renameTagAction } from "@/modules/creation/tags/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface TagWithCounts {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  _count: { npcs: number; locations: number; factions: number; lorePages: number; ideas: number };
}

function totalUsage(tag: TagWithCounts) {
  return tag._count.npcs + tag._count.locations + tag._count.factions + tag._count.lorePages + tag._count.ideas;
}

function TagRow({ tag, campaignId }: { tag: TagWithCounts; campaignId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const usage = totalUsage(tag);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await renameTagAction(tag.id, campaignId, name, color);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setIsEditing(false);
    });
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : "#8b5cf6"}
            onChange={(event) => setColor(event.target.value)}
            className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0"
          />
          <Input value={name} onChange={(event) => setName(event.target.value)} className="max-w-56" />
          <Button size="icon" variant="ghost" disabled={isPending} onClick={handleSave}>
            <Check className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" disabled={isPending} onClick={() => setIsEditing(false)}>
            <X className="size-4" />
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="flex items-center gap-3">
        <Badge
          variant="secondary"
          style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
          className="border"
        >
          {tag.name}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {usage === 0 ? "Não usada ainda" : `Usada em ${usage} ${usage === 1 ? "item" : "itens"}`}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
          <Pencil className="size-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Excluir tag "${tag.name}"?`}
        description={
          usage > 0
            ? `Esta tag está em ${usage} ${usage === 1 ? "item" : "itens"}. Excluí-la remove essa marcação de todos eles, mas nenhum conteúdo é apagado.`
            : "Esta tag ainda não está em uso."
        }
        confirmLabel="Excluir"
        onConfirm={() => deleteTagAction(tag.id, campaignId)}
      />
    </div>
  );
}

export function TagsManager({ tags, campaignId }: { tags: TagWithCounts[]; campaignId: string }) {
  if (tags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma tag criada ainda. Tags podem ser criadas diretamente ao editar um NPC, Local, Facção, página
        de Lore ou Ideia.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {tags.map((tag) => (
        <TagRow key={tag.id} tag={tag} campaignId={campaignId} />
      ))}
    </div>
  );
}
