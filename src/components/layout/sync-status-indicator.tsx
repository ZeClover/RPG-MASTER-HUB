"use client";

import { Cloud, CloudOff, Loader2, AlertTriangle, CloudUpload } from "lucide-react";

import { useSyncStore, type SyncStatus } from "@/lib/sync-store";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const STATUS_CONFIG: Record<SyncStatus, { label: string; icon: typeof Cloud; className: string }> = {
  synced: { label: "Sincronizado", icon: Cloud, className: "text-success" },
  saving: { label: "Salvando…", icon: Loader2, className: "text-muted-foreground animate-spin" },
  pending: { label: "Alterações pendentes", icon: CloudUpload, className: "text-accent" },
  offline: { label: "Offline", icon: CloudOff, className: "text-muted-foreground" },
  error: { label: "Erro ao sincronizar", icon: AlertTriangle, className: "text-destructive" },
};

export function SyncStatusIndicator() {
  const status = useSyncStore((state) => state.status);
  const pendingWrites = useSyncStore((state) => state.pendingWrites);
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const label =
    status === "pending" && pendingWrites > 0
      ? `${pendingWrites} ${pendingWrites === 1 ? "alteração pendente" : "alterações pendentes"}`
      : config.label;

  return (
    <Tooltip>
      <TooltipTrigger className="flex items-center justify-center rounded-md p-2 hover:bg-surface-elevated">
        <Icon className={cn("size-4", config.className)} />
        <span className="sr-only">{label}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
