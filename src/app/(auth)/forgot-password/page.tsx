import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-lg font-semibold">Esqueci minha senha</h1>
        <p className="text-sm text-muted-foreground">Informe seu e-mail para receber um link de redefinição.</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
