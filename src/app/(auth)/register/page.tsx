import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-lg font-semibold">Criar conta</h1>
        <p className="text-sm text-muted-foreground">Comece a construir suas campanhas de RPG.</p>
      </div>
      <RegisterForm />
    </div>
  );
}
