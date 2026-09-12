"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";

import { logoutAction } from "@/modules/core/auth/actions";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function LogoutMenuItem() {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenuItem disabled={isPending} onSelect={() => startTransition(() => logoutAction())}>
      <LogOut className="size-4" /> Sair
    </DropdownMenuItem>
  );
}
