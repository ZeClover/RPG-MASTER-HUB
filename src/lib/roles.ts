// Ranking de papéis de campanha, compartilhado entre código de servidor
// (modules/core/permissions) e componentes de cliente (ex.: filtrar itens da
// sidebar por papel) — por isso este arquivo não importa `db`/`server-only`,
// só o tipo do Prisma. Ver ARCHITECTURE.md, seção 9 e Fase 9.
import type { CampaignRole } from "@/generated/prisma/client";

export const CAMPAIGN_ROLE_RANK: Record<CampaignRole, number> = {
  PLAYER: 0,
  CO_GM: 1,
  OWNER: 2,
};

/** `role` satisfaz o mínimo exigido (`minRole`)? Mesma regra usada por `requireCampaignAccess`. */
export function roleAtLeast(role: CampaignRole, minRole: CampaignRole): boolean {
  return CAMPAIGN_ROLE_RANK[role] >= CAMPAIGN_ROLE_RANK[minRole];
}
