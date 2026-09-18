import { z } from "zod";

export const requestPasswordResetSchema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }),
});
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

// Mesma regra de senha de `registerSchema` (Fase 0) — o custo de bcrypt (10)
// também precisa bater, mas isso é decidido em `actions.ts`, não aqui.
export const resetPasswordSchema = z.object({
  token: z.string().min(1, { error: "Link inválido ou expirado." }),
  password: z
    .string()
    .min(8, { error: "A senha precisa ter ao menos 8 caracteres." })
    .regex(/[a-zA-Z]/, { error: "A senha precisa conter ao menos uma letra." })
    .regex(/[0-9]/, { error: "A senha precisa conter ao menos um número." }),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
