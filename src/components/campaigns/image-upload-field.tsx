"use client";

import { useState, type ChangeEvent } from "react";
import { ImageIcon } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ImageUploadFieldProps {
  name: string;
  label: string;
  defaultValue?: string | null;
  campaignId?: string;
  shape?: "square" | "banner";
}

const ACCEPTED_TYPES = "image/png,image/jpeg,image/webp,image/gif";

export function ImageUploadField({ name, label, defaultValue, campaignId, shape = "square" }: ImageUploadFieldProps) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (campaignId) formData.append("campaignId", campaignId);

      const response = await fetch("/api/v1/uploads", { method: "POST", body: formData });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Falha ao enviar imagem.");
      }

      const body = (await response.json()) as { url: string };
      setUrl(body.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Falha ao enviar imagem.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-elevated text-muted-foreground",
            shape === "square" ? "size-16" : "h-16 w-32",
          )}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- imagens vêm de origens dinâmicas (upload local ou Vercel Blob)
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="size-5" />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <input
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
            disabled={isUploading}
            className="text-xs text-muted-foreground file:mr-2 file:cursor-pointer file:rounded-md file:border-0 file:bg-surface-elevated file:px-2 file:py-1 file:text-xs file:text-foreground"
          />
          {isUploading && <span className="text-xs text-muted-foreground">Enviando…</span>}
          {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
      </div>
      <input type="hidden" name={name} value={url} />
    </div>
  );
}
