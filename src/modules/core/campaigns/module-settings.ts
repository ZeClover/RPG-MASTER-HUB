import "server-only";

import { db } from "@/lib/db";
import { TOGGLEABLE_MODULES } from "@/components/layout/campaign-nav-items";

/**
 * Estado ligado/desligado resolvido de cada módulo alternável para uma
 * campanha (Fase 10, ver ARCHITECTURE.md, seção 21): override salvo em
 * `CampaignModuleSetting` quando existir, senão o `defaultEnabled` do
 * registro (`TOGGLEABLE_MODULES`). Itens `alwaysOn` não entram aqui — a
 * sidebar sempre os renderiza, independente deste conjunto.
 */
export async function getEnabledModuleKeys(campaignId: string): Promise<Set<string>> {
  const overrides = await db.campaignModuleSetting.findMany({
    where: { campaignId },
    select: { moduleKey: true, enabled: true },
  });
  const overrideMap = new Map(overrides.map((override) => [override.moduleKey, override.enabled]));

  const enabled = new Set<string>();
  for (const item of TOGGLEABLE_MODULES) {
    if (overrideMap.get(item.key) ?? item.defaultEnabled) {
      enabled.add(item.key);
    }
  }
  return enabled;
}
