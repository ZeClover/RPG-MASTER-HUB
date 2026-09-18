import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// `resetPasswordAction`/`requestPasswordResetAction` são Server Actions
// ("use server") que chamam `next/headers` (`headers()`) para montar a URL
// do link — fora do runtime do Next isso não tem uma requisição de verdade
// por trás, então mockamos só o suficiente pra não quebrar (não testamos a
// URL em si, só o comportamento de negócio: token criado/consumido, resposta
// genérica, senha realmente trocada).
vi.mock("next/headers", () => ({
  headers: async () => new Map([["host", "localhost:3000"]]),
}));

import { db } from "@/lib/db";
import {
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/modules/core/auth/password-reset/actions";

function formData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

describe("fluxo de recuperação de senha", () => {
  let userId: string;
  let userEmail: string;

  beforeAll(async () => {
    const suffix = randomUUID().slice(0, 8);
    userEmail = `reset-flow-${suffix}@test.local`;
    const passwordHash = await bcrypt.hash("senha-antiga-123", 10);
    const user = await db.user.create({ data: { name: "Usuário do teste de reset", email: userEmail, passwordHash } });
    userId = user.id;
  });

  afterAll(async () => {
    await db.verificationToken.deleteMany({ where: { identifier: userEmail } });
    await db.user.deleteMany({ where: { id: userId } });
  });

  it("pedir reset para um e-mail existente cria um VerificationToken e devolve a mensagem genérica", async () => {
    const state = await requestPasswordResetAction(undefined, formData({ email: userEmail }));
    expect(state?.message).toBe("Se esse e-mail existir na nossa base, enviamos um link de redefinição.");

    const token = await db.verificationToken.findFirst({ where: { identifier: userEmail } });
    expect(token).not.toBeNull();
    expect(token!.expires.getTime()).toBeGreaterThan(Date.now());
  });

  it("pedir reset para um e-mail INEXISTENTE devolve a MESMA mensagem genérica e não cria token nenhum", async () => {
    const nonExistentEmail = `nao-existe-${randomUUID().slice(0, 8)}@test.local`;
    const state = await requestPasswordResetAction(undefined, formData({ email: nonExistentEmail }));

    expect(state?.message).toBe("Se esse e-mail existir na nossa base, enviamos um link de redefinição.");

    const token = await db.verificationToken.findFirst({ where: { identifier: nonExistentEmail } });
    expect(token).toBeNull();
  });

  it("redefinir com o token válido troca a senha e a senha antiga para de funcionar", async () => {
    const token = await db.verificationToken.findFirstOrThrow({ where: { identifier: userEmail } });

    const state = await resetPasswordAction(undefined, formData({ token: token.token, password: "senha-nova-456" }));
    expect(state?.success).toBe(true);

    const updatedUser = await db.user.findUniqueOrThrow({ where: { id: userId } });
    expect(await bcrypt.compare("senha-nova-456", updatedUser.passwordHash!)).toBe(true);
    expect(await bcrypt.compare("senha-antiga-123", updatedUser.passwordHash!)).toBe(false);
  });

  it("um token já usado (ou inexistente) falha com uma mensagem que não distingue os dois casos", async () => {
    const staleToken = await db.verificationToken.findFirst({ where: { identifier: userEmail } });
    expect(staleToken).toBeNull(); // o teste anterior já consumiu (apagou) o token

    const state = await resetPasswordAction(
      undefined,
      formData({ token: "um-token-que-nunca-existiu", password: "outra-senha-789" }),
    );
    expect(state?.success).toBeUndefined();
    expect(state?.message).toBe("Link inválido ou expirado. Peça uma nova redefinição.");
  });

  it("um token expirado é rejeitado e apagado (não pode ser tentado de novo)", async () => {
    const expiredToken = randomBytesHex();
    await db.verificationToken.create({
      data: { identifier: userEmail, token: expiredToken, expires: new Date(Date.now() - 60_000) },
    });

    const state = await resetPasswordAction(undefined, formData({ token: expiredToken, password: "mais-uma-senha-000" }));
    expect(state?.message).toBe("Link inválido ou expirado. Peça uma nova redefinição.");

    const stillThere = await db.verificationToken.findUnique({ where: { token: expiredToken } });
    expect(stillThere).toBeNull();
  });
});

function randomBytesHex() {
  return randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
}
