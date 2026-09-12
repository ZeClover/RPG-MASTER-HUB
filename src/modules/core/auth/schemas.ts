import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }),
  password: z.string().min(1, { error: "Informe sua senha." }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(2, { error: "O nome precisa ter ao menos 2 caracteres." }),
  email: z.email({ error: "Informe um e-mail válido." }),
  password: z
    .string()
    .min(8, { error: "A senha precisa ter ao menos 8 caracteres." })
    .regex(/[a-zA-Z]/, { error: "A senha precisa conter ao menos uma letra." })
    .regex(/[0-9]/, { error: "A senha precisa conter ao menos um número." }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
