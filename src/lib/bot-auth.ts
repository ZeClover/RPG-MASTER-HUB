import "server-only";

/**
 * Autenticação das rotas `/api/v1/bot/*` — chamadas só pelos processos de
 * bot do Discord (nunca por sessão de usuário, ver ARCHITECTURE.md, "Bots do
 * Discord"). Um secret compartilhado simples (`BOT_SERVICE_SECRET`), não OAuth
 * nem JWT: os bots não são usuários, são processos de confiança que só o
 * mestre da infraestrutura controla — o mesmo padrão de "secret de serviço"
 * já previsto desde a Fase 0.
 */
export function isAuthorizedBotRequest(request: Request): boolean {
  const secret = process.env.BOT_SERVICE_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/** Resolve uma URL de arquivo (relativa, do provider local, ou já absoluta, do Vercel Blob) contra a origem do próprio hub. */
export function resolveFileUrl(origin: string, fileUrl: string): string {
  return /^https?:\/\//.test(fileUrl) ? fileUrl : `${origin}${fileUrl}`;
}
