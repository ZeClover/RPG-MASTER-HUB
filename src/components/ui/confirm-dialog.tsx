"use client";

import { useState, useTransition, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => Promise<{ error?: string } | void>;
}

/**
 * Diálogo de confirmação controlado externamente — usar para qualquer ação
 * destrutiva (excluir, arquivar em massa). Fica fora da árvore de um
 * DropdownMenu para evitar o conflito de foco/desmontagem entre os dois
 * primitivos do Radix quando o gatilho é um item de menu.
 *
 * `onConfirm` deve RETORNAR `{ error }` em vez de lançar exceção — Server
 * Actions têm sua mensagem de erro redigida em produção quando o erro é
 * lançado, então falhas esperadas (ex.: "local tem sublocais") precisam
 * voltar como valor normal para chegar legíveis até aqui.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  variant = "destructive",
  onConfirm,
}: ConfirmDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) setError(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>
            <div>{description}</div>
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant={variant}
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await onConfirm();
                if (result?.error) {
                  setError(result.error);
                  return;
                }
                onOpenChange(false);
              })
            }
          >
            {isPending ? "Aguarde…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
