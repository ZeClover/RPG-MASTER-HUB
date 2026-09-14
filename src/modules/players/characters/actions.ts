"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { characterFormSchema, type CharacterFormInput } from "@/modules/players/characters/schemas";

export type CharacterFormState =
  | {
      errors?: Partial<Record<keyof CharacterFormInput, string[]>>;
      error?: string;
      message?: string;
    }
  | undefined;

function n(value: string | undefined) {
  return value ? value : null;
}

function rawEntries(formData: FormData) {
  return {
    name: formData.get("name"),
    concept: formData.get("concept"),
    imageUrl: formData.get("imageUrl"),
    bio: formData.get("bio"),
    // `gmNotes` só existe no DOM quando quem envia é CO_GM/OWNER (ver
    // CharacterForm) — para um PLAYER o campo nem está no form, então
    // `FormData.get` devolve `null`, que `z.string().optional()` (só aceita
    // `undefined`) rejeitaria. `?? ""` cai no ramo `.or(z.literal(""))`.
    gmNotes: formData.get("gmNotes") ?? "",
  };
}

/**
 * Qualquer membro (PLAYER incluído) pode criar — é a própria ficha da
 * pessoa. `gmNotes` e a atribuição a outro jogador (`playerId` no form) só
 * são aplicados quando o papel de quem envia é CO_GM/OWNER, checado aqui no
 * servidor — nunca confiar em campo oculto do formulário para isso.
 */
export async function createCharacterAction(
  campaignId: string,
  _prevState: CharacterFormState,
  formData: FormData,
): Promise<CharacterFormState> {
  const user = await requireUser();
  const membership = await requireCampaignAccess(user.id, campaignId, "PLAYER");
  const isGm = membership.role === "CO_GM" || membership.role === "OWNER";

  const parsed = characterFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  let playerId = user.id;
  const requestedPlayerId = formData.get("playerId");
  if (isGm && typeof requestedPlayerId === "string" && requestedPlayerId && requestedPlayerId !== "__self__") {
    const targetMembership = await db.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId: requestedPlayerId } },
    });
    if (!targetMembership) {
      return { error: "O jogador selecionado não é membro desta campanha." };
    }
    playerId = requestedPlayerId;
  }

  const character = await db.character.create({
    data: {
      campaignId,
      playerId,
      name: parsed.data.name,
      concept: n(parsed.data.concept),
      imageUrl: n(parsed.data.imageUrl),
      bio: n(parsed.data.bio),
      gmNotes: isGm ? n(parsed.data.gmNotes) : null,
    },
  });

  revalidatePath(`/campaigns/${campaignId}/characters`);
  redirect(`/campaigns/${campaignId}/characters/${character.id}`);
}

/** Dona da ficha OU CO_GM/OWNER podem editar/excluir; qualquer outro caso é um erro de validação, não uma `CampaignAccessError` (a pessoa tem acesso à campanha, só não a esta ficha específica). */
async function loadManageableCharacter(userId: string, campaignId: string, characterId: string) {
  const membership = await requireCampaignAccess(userId, campaignId, "PLAYER");
  const character = await db.character.findFirst({ where: { id: characterId, campaignId } });
  const isGm = membership.role === "CO_GM" || membership.role === "OWNER";
  const canManage = Boolean(character) && (isGm || character!.playerId === userId);
  return { character, canManage, isGm };
}

export async function updateCharacterAction(
  campaignId: string,
  characterId: string,
  _prevState: CharacterFormState,
  formData: FormData,
): Promise<CharacterFormState> {
  const user = await requireUser();

  let character, canManage, isGm;
  try {
    ({ character, canManage, isGm } = await loadManageableCharacter(user.id, campaignId, characterId));
  } catch (error) {
    if (error instanceof CampaignAccessError) return { error: error.message };
    throw error;
  }
  if (!character) return { error: "Ficha não encontrada." };
  if (!canManage) return { error: "Você só pode editar a sua própria ficha." };

  const parsed = characterFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.character.update({
    where: { id: characterId },
    data: {
      name: parsed.data.name,
      concept: n(parsed.data.concept),
      imageUrl: n(parsed.data.imageUrl),
      bio: n(parsed.data.bio),
      ...(isGm ? { gmNotes: n(parsed.data.gmNotes) } : {}),
    },
  });

  revalidatePath(`/campaigns/${campaignId}/characters`);
  revalidatePath(`/campaigns/${campaignId}/characters/${characterId}`);
  redirect(`/campaigns/${campaignId}/characters/${characterId}`);
}

export async function deleteCharacterAction(campaignId: string, characterId: string) {
  const user = await requireUser();

  let character, canManage;
  try {
    ({ character, canManage } = await loadManageableCharacter(user.id, campaignId, characterId));
  } catch (error) {
    if (error instanceof CampaignAccessError) return { error: error.message };
    throw error;
  }
  if (!character) return;
  if (!canManage) return { error: "Você só pode excluir a sua própria ficha." };

  await db.character.delete({ where: { id: characterId } });

  revalidatePath(`/campaigns/${campaignId}/characters`);
  redirect(`/campaigns/${campaignId}/characters`);
}
