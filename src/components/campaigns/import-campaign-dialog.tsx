"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Upload, CheckCircle2 } from "lucide-react";

import { importCampaignAction } from "@/modules/core/campaigns/export/actions";
import { EXPORT_DATA_LABELS, type CampaignExportData } from "@/modules/core/campaigns/export/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** "Importar campanha" (Fase 12, Part 2) — botão ao lado de "Nova campanha" em `/home`. */
export function ImportCampaignDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(importCampaignAction, undefined);

  const summaryRows = state?.success
    ? (Object.keys(EXPORT_DATA_LABELS) as Array<keyof CampaignExportData>)
        .map((key) => ({ label: EXPORT_DATA_LABELS[key], count: state.success!.summary.counts[key] ?? 0 }))
        .filter((row) => row.count > 0)
    : [];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="size-4" /> Importar campanha
        </Button>
      </DialogTrigger>
      <DialogContent>
        {state?.success ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-primary" /> Campanha importada
              </DialogTitle>
              <DialogDescription>
                &ldquo;{state.success.campaignName}&rdquo; foi criada como uma campanha NOVA — nada na sua conta foi
                sobrescrito.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {summaryRows.map((row) => (
                    <tr key={row.label} className="border-b border-border last:border-0">
                      <td className="px-3 py-1.5 text-muted-foreground">{row.label}</td>
                      <td className="px-3 py-1.5 text-right font-medium">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {state.success.summary.warnings.length > 0 && (
              <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                {state.success.summary.warnings.map((warning) => (
                  <li key={warning}>• {warning}</li>
                ))}
              </ul>
            )}

            <DialogFooter>
              <Button asChild className="w-full">
                <Link href={`/campaigns/${state.success.campaignId}/dashboard`}>Ir para a campanha</Link>
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Importar campanha</DialogTitle>
              <DialogDescription>
                Cria uma campanha NOVA a partir de um backup (.zip) — nunca sobrescreve uma campanha existente,
                mesmo que o arquivo tenha o mesmo nome de uma campanha sua.
              </DialogDescription>
            </DialogHeader>

            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

            <div className="flex flex-col gap-2">
              <Label htmlFor="file">Arquivo de backup (.zip)</Label>
              <Input id="file" name="file" type="file" accept=".zip,application/zip" required />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={pending}>
                {pending ? "Importando…" : "Importar"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
