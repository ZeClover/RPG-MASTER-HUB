"use client";

import { useActionState } from "react";
import Link from "next/link";

import { resetPasswordAction } from "@/modules/core/auth/password-reset/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, undefined);

  if (state?.success) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-foreground">{state.message}</p>
        <Link href="/login" className="text-sm text-primary hover:underline">
          Ir para o login
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-destructive">Link inválido ou expirado. Peça uma nova redefinição.</p>
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
          Pedir novo link
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Nova senha</Label>
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
        {pending ? "Redefinindo…" : "Redefinir senha"}
      </Button>
    </form>
  );
}
