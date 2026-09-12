"use client";

import { useActionState } from "react";
import Link from "next/link";

import { loginAction } from "@/modules/core/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="voce@exemplo.com" />
        {state?.errors?.email && <p className="text-xs text-destructive">{state.errors.email[0]}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
        {state?.errors?.password && <p className="text-xs text-destructive">{state.errors.password[0]}</p>}
      </div>

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Entrando…" : "Entrar"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
