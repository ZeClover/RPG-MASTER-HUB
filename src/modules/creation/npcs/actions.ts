"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { relationshipsInvolvingEntity } from "@/modules/creation/relationships/queries";
import { npcFormSchema, type NpcFormInput } from "@/modules/creation/npcs/schemas";

export type NpcFormState =
  | {
      errors?: Partial<Record<keyof NpcFormInput, string[]>>;
      message?: string;
    }
  | undefined;

function rawEntries(formData: FormData) {
  return {
    name: formData.get("name"),
    imageUrl: formData.get("imageUrl"),
    age: formData.get("age"),
    species: formData.get("species"),
    gender: formData.get("gender"),
    appearance: formData.get("appearance"),
    personality: formData.get("personality"),
    history: formData.get("history"),
    goals: formData.get("goals"),
    fears: formData.get("fears"),
    secrets: formData.get("secrets"),
    narrativeStatus: formData.get("narrativeStatus"),
    gmNotes: formData.get("gmNotes"),
    canonStatus: formData.get("canonStatus"),
    visibility: formData.get("visibility"),
  };
}

function n(value: string | undefined) {
  return value ? value : null;
}

function buildNpcData(data: NpcFormInput) {
  return {
    name: data.name,
    imageUrl: n(data.imageUrl),
    age: n(data.age),
    species: n(data.species),
    gender: n(data.gender),
    appearance: n(data.appearance),
    personality: n(data.personality),
    history: n(data.history),
    goals: n(data.goals),
    fears: n(data.fears),
    secrets: n(data.secrets),
    narrativeStatus: n(data.narrativeStatus),
    gmNotes: n(data.gmNotes),
    canonStatus: data.canonStatus,
    visibility: data.visibility,
  };
}

async function syncNpcTags(npcId: string, tagIds: string[]) {
  await db.npcTag.deleteMany({ where: { npcId, tagId: { notIn: tagIds } } });
  if (tagIds.length > 0) {
    await db.npcTag.createMany({ data: tagIds.map((tagId) => ({ npcId, tagId })), skipDuplicates: true });
  }
}

/**
 * Criação rápida usada pelo Modo Sessão (Fase 3): o mestre precisa nomear um
 * NPC improvisado no meio da mesa sem sair da tela de sessão — diferente de
 * `createNpcAction`, não redireciona, aceita só nome + uma nota opcional, e
 * devolve o NPC criado para a UI decidir o que fazer (ex.: logar no Session
 * Log). Deliberadamente não passa pela fila de escrita offline: criar NPC é
 * raro no meio de uma sessão comparado a rolar dados ou atualizar HP, então
 * o custo de tratar essa exceção (mostrar erro e pedir para tentar de novo
 * quando a conexão voltar) é menor que o de mais um tipo de operação na fila.
 */
export async function quickCreateNpcAction(campaignId: string, name: string, note?: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const trimmedName = name.trim();
  if (!trimmedName) {
    return { error: "Informe um nome." };
  }

  const npc = await db.npc.create({
    data: { campaignId, name: trimmedName, gmNotes: note?.trim() || null },
    select: { id: true, name: true },
  });

  revalidatePath(`/campaigns/${campaignId}/npcs`);
  return { npc };
}

export async function createNpcAction(
  campaignId: string,
  _prevState: NpcFormState,
  formData: FormData,
): Promise<NpcFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = npcFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  const npc = await db.npc.create({
    data: {
      ...buildNpcData(parsed.data),
      campaignId,
      tags: tagIds.length > 0 ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
  });

  revalidatePath(`/campaigns/${campaignId}/npcs`);
  redirect(`/campaigns/${campaignId}/npcs/${npc.id}`);
}

export async function updateNpcAction(
  campaignId: string,
  npcId: string,
  _prevState: NpcFormState,
  formData: FormData,
): Promise<NpcFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = npcFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  await db.npc.update({ where: { id: npcId }, data: buildNpcData(parsed.data) });
  await syncNpcTags(npcId, tagIds);

  revalidatePath(`/campaigns/${campaignId}/npcs`);
  revalidatePath(`/campaigns/${campaignId}/npcs/${npcId}`);
  redirect(`/campaigns/${campaignId}/npcs/${npcId}`);
}

export async function toggleNpcFavoriteAction(campaignId: string, npcId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const npc = await db.npc.findFirst({ where: { id: npcId, campaignId }, select: { favorite: true } });
  if (!npc) return;

  await db.npc.update({ where: { id: npcId }, data: { favorite: !npc.favorite } });
  revalidatePath(`/campaigns/${campaignId}/npcs`);
  revalidatePath(`/campaigns/${campaignId}/npcs/${npcId}`);
}

export async function toggleNpcArchivedAction(campaignId: string, npcId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const npc = await db.npc.findFirst({ where: { id: npcId, campaignId }, select: { archived: true } });
  if (!npc) return;

  await db.npc.update({ where: { id: npcId }, data: { archived: !npc.archived } });
  revalidatePath(`/campaigns/${campaignId}/npcs`);
  revalidatePath(`/campaigns/${campaignId}/npcs/${npcId}`);
}

export async function deleteNpcAction(campaignId: string, npcId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.$transaction([
    db.relationship.deleteMany({ where: { campaignId, ...relationshipsInvolvingEntity("NPC", npcId) } }),
    db.npc.delete({ where: { id: npcId } }),
  ]);

  revalidatePath(`/campaigns/${campaignId}/npcs`);
  redirect(`/campaigns/${campaignId}/npcs`);
}
