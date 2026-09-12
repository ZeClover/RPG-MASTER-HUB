import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-lg font-semibold">Bem-vindo de volta</h1>
        <p className="text-sm text-muted-foreground">Entre para continuar suas campanhas.</p>
      </div>
      <LoginForm />
    </div>
  );
}
