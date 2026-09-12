import "server-only";

import { db } from "@/lib/db";

export function listNarrativeClocks(campaignId: string, options: { archived?: boolean } = {}) {
  return db.narrativeClock.findMany({
    where: { campaignId, archived: options.archived ?? false },
    orderBy: { createdAt: "desc" },
  });
}
