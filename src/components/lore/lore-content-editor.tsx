"use client";

import { useState, useTransition } from "react";

import { previewMarkdownAction } from "@/modules/creation/lore/actions";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LoreContentEditor({ defaultValue }: { defaultValue?: string | null }) {
  const [content, setContent] = useState(defaultValue ?? "");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [previewHtml, setPreviewHtml] = useState("");
  const [isPending, startTransition] = useTransition();

  function handlePreview() {
    startTransition(async () => {
      const html = await previewMarkdownAction(content);
      setPreviewHtml(html);
      setTab("preview");
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="content">Conteúdo (Markdown)</Label>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={tab === "edit" ? "secondary" : "ghost"}
            onClick={() => setTab("edit")}
          >
            Editar
          </Button>
          <Button type="button" size="sm" variant={tab === "preview" ? "secondary" : "ghost"} disabled={isPending} onClick={handlePreview}>
            {isPending ? "Gerando…" : "Pré-visualizar"}
          </Button>
        </div>
      </div>

      <Textarea
        id="content"
        name="content"
        rows={14}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Escreva em Markdown — # títulos, **negrito**, listas, links…"
        hidden={tab !== "edit"}
        className={cn("font-mono text-sm", tab !== "edit" && "sr-only")}
      />

      {tab === "preview" && (
        <div
          className="prose prose-sm prose-invert max-w-none rounded-lg border border-border bg-surface p-4"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      )}
    </div>
  );
}
