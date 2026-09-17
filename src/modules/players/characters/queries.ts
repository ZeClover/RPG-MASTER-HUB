import "server-only";

import { db } from "@/lib/db";
import { requireCampaignAccess, stripGmFields } from "@/modules/core/permissions";

/** Único campo "só do mestre" do Character (mesmo padrão de `Npc.gmNotes`, ver ARCHITECTURE.md, seção 21.2). */
const CHARACTER_GM_ONLY_FIELDS = ["gmNotes"] as const;

/**
 * Personagens são vistos por toda a mesa (PCs de verdade, não conteúdo de
 * bastidor) — diferente de NPC/Facção/etc., não há filtro por `visibility`
 * aqui. Só `gmNotes` é zerado para PLAYER via `stripGmFields`.
 */
export async function listCharacters(userId: string, campaignId: string) {
  const { role } = await requireCampaignAccess(userId, campaignId);

  const characters = await db.character.findMany({
    where: { campaignId },
    orderBy: { createdAt: "asc" },
    include: { player: { select: { id: true, name: true, email: true } } },
  });

  return characters.map((character) => stripGmFields(character, role, [...CHARACTER_GM_ONLY_FIELDS])!);
}

export async function getCharacterForUser(userId: string, campaignId: string, characterId: string) {
  const { role } = await requireCampaignAccess(userId, campaignId);
  const character = await db.character.findFirst({
    where: { id: characterId, campaignId },
    include: { player: { select: { id: true, name: true, email: true } } },
  });
  if (!character) return null;
  return stripGmFields(character, role, [...CHARACTER_GM_ONLY_FIELDS]);
}

export function countCharacters(campaignId: string) {
  return db.character.count({ where: { campaignId } });
}
