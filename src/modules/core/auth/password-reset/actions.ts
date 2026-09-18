"use server";

import { randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";

import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/modules/core/auth/password-reset/schemas";

const GENERIC_SUCCESS_MESSAGE = "Se esse e-mail existir na nossa base, enviamos um link de redefinição.";
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export type RequestPasswordResetFormState =
  | {
      errors?: { email?: string[] };
      message?: string;
    }
  | undefined;

export type ResetPasswordFormState =
  | {
      errors?: Partial<Record<keyof ResetPasswordInput, string[]>>;
      message?: string;
      success?: boolean;
    }
  | undefined;

/** Origem da própria requisição (funciona em dev, preview e produção sem precisar de mais uma env var). */
async function resolveBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}

/**
 * Fase 12, Part 5 — pedido de redefinição de senha. Anti-enumeração,
 * não-negociável (ver ARCHITECTURE.md): a resposta é SEMPRE a mesma
 * mensagem genérica, exista ou não uma conta com este e-mail — só o que
 * acontece "por dentro" (criar token, mandar e-mail) muda. Isso é decidido
 * inteiramente dentro do `if (user)`, nunca com um retorno antecipado de
 * formato diferente.
 */
export async function requestPasswordResetAction(
  _prevState: RequestPasswordResetFormState,
  formData: FormData,
): Promise<RequestPasswordResetFormState> {
  const parsed = requestPasswordResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { email } = parsed.data;

  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (user) {
    // Invalida qualquer link antigo pendente antes de criar um novo.
    await db.verificationToken.deleteMany({ where: { identifier: email } });

    const token = randomBytes(32).toString("hex");
    await db.verificationToken.create({
      data: { identifier: email, token, expires: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
    });

    const baseUrl = await resolveBaseUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetUrl);
  }

  return { message: GENERIC_SUCCESS_MESSAGE };
}

/**
 * Redefine a senha a partir de um token válido. Uso único: o token é apagado
 * assim que é consultado, dê certo ou não a redefinição — um token expirado
 * ou já usado nunca pode ser tentado de novo.
 */
export async function resetPasswordAction(
  _prevState: ResetPasswordFormState,
  formData: FormData,
): Promise<ResetPasswordFormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { token, password } = parsed.data;

  const verificationToken = await db.verificationToken.findUnique({ where: { token } });
  if (verificationToken) {
    await db.verificationToken.delete({ where: { token } });
  }

  // "Link inválido ou expirado" não distingue os dois casos de propósito —
  // saber que um TOKEN é inválido não vaza se um E-MAIL existe (diferente do
  // fluxo de pedido de reset, acima).
  if (!verificationToken || verificationToken.expires < new Date()) {
    return { message: "Link inválido ou expirado. Peça uma nova redefinição." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const updateResult = await db.user.updateMany({
    where: { email: verificationToken.identifier },
    data: { passwordHash },
  });

  if (updateResult.count === 0) {
    return { message: "Link inválido ou expirado. Peça uma nova redefinição." };
  }

  return { success: true, message: "Senha redefinida com sucesso. Você já pode entrar." };
}
