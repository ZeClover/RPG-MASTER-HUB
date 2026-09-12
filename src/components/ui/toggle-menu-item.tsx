"use client";

import { useTransition } from "react";
import type { LucideIcon } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface ToggleMenuItemProps {
  icon: LucideIcon;
  label: string;
  action: () => Promise<void>;
  disabled?: boolean;
}

/** Item de menu suspenso que dispara uma Server Action de 0 argumentos direto no onSelect. */
export function ToggleMenuItem({ icon: Icon, label, action, disabled }: ToggleMenuItemProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenuItem
      disabled={disabled || isPending}
      onSelect={() => startTransition(() => action())}
    >
      <Icon className="size-4" /> {label}
    </DropdownMenuItem>
  );
}
