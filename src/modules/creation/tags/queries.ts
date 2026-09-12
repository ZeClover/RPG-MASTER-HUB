import "server-only";

import { db } from "@/lib/db";

export function listTagsForCampaign(campaignId: string) {
  return db.tag.findMany({
    where: { campaignId },
    orderBy: { name: "asc" },
  });
}

export async function countTagUsage(tagId: string) {
  const [npcs, locations, factions, lorePages, ideas] = await Promise.all([
    db.npcTag.count({ where: { tagId } }),
    db.locationTag.count({ where: { tagId } }),
    db.factionTag.count({ where: { tagId } }),
    db.lorePageTag.count({ where: { tagId } }),
    db.ideaTag.count({ where: { tagId } }),
  ]);

  return npcs + locations + factions + lorePages + ideas;
}

export function listTagsWithUsage(campaignId: string) {
  return db.tag.findMany({
    where: { campaignId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { npcs: true, locations: true, factions: true, lorePages: true, ideas: true },
      },
    },
  });
}
