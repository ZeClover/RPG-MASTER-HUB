"use server";

import { requireUser } from "@/modules/core/auth/session";
import { searchCampaign } from "@/modules/core/search/queries";

// `searchCampaign` já resolve `role` via `requireCampaignAccess` internamente (Fase 11, ver
// ARCHITECTURE.md, seção 22) — chamar de novo aqui seria redundante, e pior: convidaria a
// dessincronizar (checar acesso aqui, mas esquecer de checar de novo lá se algum dia esta action
// deixar de ser o único chamador).
export async function searchCampaignAction(campaignId: string, query: string) {
  const user = await requireUser();
  return searchCampaign(user.id, campaignId, query);
}
