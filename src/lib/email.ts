import "server-only";

/**
 * Fase 12, Part 5 — envio de e-mail transacional (só recuperação de senha por
 * enquanto). Chama a REST API do Resend diretamente com `fetch` — não vale a
 * pena adicionar o SDK inteiro como dependência para uma única chamada.
 *
 * Sem `RESEND_API_KEY` configurada (padrão em desenvolvimento e em produção
 * até alguém configurar de verdade), cai no fallback: registra a URL nos logs
 * do servidor (Vercel Function Logs, visível só a quem já tem acesso ao
 * projeto — o mesmo nível de confiança de quem já poderia rodar SQL direto no
 * banco) e devolve `{ sent: false }`. A URL NUNCA é devolvida para quem chamou
 * — ver a nota anti-enumeração em `password-reset/actions.ts`: se a URL
 * vazasse pro cliente/resposta, dar reset em qualquer e-mail (existente ou
 * não) teria uma resposta observável diferente, e um atacante descobriria
 * quais e-mails têm conta só de ver quando o "link" aparece.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[email] RESEND_API_KEY não configurada — link de redefinição de senha para ${to}: ${resetUrl}`);
    return { sent: false };
  }

  const from = process.env.EMAIL_FROM || "RPG Master Hub <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Redefinir sua senha — RPG Master Hub",
      html: `
        <p>Alguém (esperamos que você) pediu para redefinir a senha da sua conta no RPG Master Hub.</p>
        <p><a href="${resetUrl}">Clique aqui para escolher uma nova senha</a>. O link expira em 1 hora.</p>
        <p>Se você não pediu isso, pode ignorar este e-mail — sua senha continua a mesma.</p>
      `,
    }),
  });

  if (!response.ok) {
    console.error(`[email] Falha ao enviar e-mail de redefinição via Resend (status ${response.status}).`);
    return { sent: false };
  }

  return { sent: true };
}
