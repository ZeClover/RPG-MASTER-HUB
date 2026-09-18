"use client";

import { useActionState } from "react";
import Link from "next/link";

import { requestPasswordResetAction } from "@/modules/core/auth/password-reset/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, undefined);

  if (state?.message) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-foreground">{state.message}</p>
        <Link href="/login" className="text-sm text-primary hover:underline">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="voce@exemplo.com" />
        {state?.errors?.email && <p className="text-xs text-destructive">{state.errors.email[0]}</p>}
      </div>

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Enviando…" : "Enviar link de redefinição"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
