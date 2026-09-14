"use client";

import { useState, useTransition } from "react";

import { setCampaignModuleEnabledAction } from "@/modules/core/campaigns/actions";
import { cn } from "@/lib/utils";

interface ModuleToggleSwitchProps {
  campaignId: string;
  moduleKey: string;
  enabled: boolean;
}

/**
 * Switch on/off feito à mão (sem `@radix-ui/react-switch`, que não é uma
 * dependência do projeto — ver `components/ui/button.tsx`/`badge.tsx` para a
 * mesma linguagem visual de trilha arredondada). `useTransition` cobre o
 * estado "aguardando a Server Action" com opacidade reduzida, mesmo espírito
 * de `ToggleMenuItem`.
 */
export function ModuleToggleSwitch({ campaignId, moduleKey, enabled }: ModuleToggleSwitchProps) {
  const [optimisticEnabled, setOptimisticEnabled] = useState(enabled);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !optimisticEnabled;
    setOptimisticEnabled(next);
    startTransition(async () => {
      const result = await setCampaignModuleEnabledAction(campaignId, moduleKey, next);
      if (result?.error) {
        setOptimisticEnabled(!next);
      }
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimisticEnabled}
      disabled={isPending}
      onClick={handleToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50",
        optimisticEnabled ? "bg-primary" : "bg-surface-elevated border border-border",
      )}
    >
      <span
        className={cn(
          "inline-block size-4 transform rounded-full bg-background shadow transition-transform",
          optimisticEnabled ? "translate-x-6" : "translate-x-1",
        )}
      />
      <span className="sr-only">{optimisticEnabled ? "Desligar módulo" : "Ligar módulo"}</span>
    </button>
  );
}
