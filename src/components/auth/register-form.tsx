"use client";

import { useActionState } from "react";
import Link from "next/link";

import { registerAction } from "@/modules/core/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required autoComplete="name" placeholder="Como devemos te chamar?" />
        {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="voce@exemplo.com" />
        {state?.errors?.email && <p className="text-xs text-destructive">{state.errors.email[0]}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" />
        {state?.errors?.password ? (
          <ul className="list-disc pl-4 text-xs text-destructive">
            {state.errors.password.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">Ao menos 8 caracteres, com letra e número.</p>
        )}
      </div>

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Criando conta…" : "Criar conta"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
