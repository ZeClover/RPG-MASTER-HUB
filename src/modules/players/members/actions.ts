"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { addMemberFormSchema, memberRoleSchema } from "@/modules/players/members/schemas";

export type AddMemberFormState = { error?: string; message?: string } | undefined;

const ROLE_LABEL: Record<"CO_GM" | "PLAYER", string> = { CO_GM: "Co-Mestre", PLAYER: "Jogador" };

/**
 * Convite = adicionar direto, não um fluxo assíncrono com token/e-mail (ver
 * ARCHITECTURE.md, seção 21.1, para a decisão completa). Exige que a pessoa
 * já tenha uma conta no hub — o e-mail identifica um `User` existente.
 */
export async function addCampaignMemberAction(
  campaignId: string,
  _prevState: AddMemberFormState,
  formData: FormData,
): Promise<AddMemberFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "OWNER");

  const parsed = addMemberFormSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { email, role } = parsed.data;

  const target = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });
  if (!target) {
    return {
      error: "Nenhum usuário encontrado com esse e-mail. A pessoa precisa criar uma conta no hub primeiro.",
    };
  }

  const campaign = await db.campaign.findUnique({ where: { id: campaignId }, select: { ownerId: true } });
  if (campaign?.ownerId === target.id) {
    return { error: "Esta pessoa já é a Mestre desta campanha." };
  }

  const existing = await db.campaignMember.findUnique({
    where: { campaignId_userId: { campaignId, userId: target.id } },
  });
  if (existing) {
    return {
      error: `${target.name ?? target.email} já é membro desta campanha — altere o papel na lista abaixo em vez de convidar de novo.`,
    };
  }

  await db.campaignMember.create({ data: { campaignId, userId: target.id, role } });

  revalidatePath(`/campaigns/${campaignId}/members`);
  return { message: `${target.name ?? target.email} adicionado(a) como ${ROLE_LABEL[role]}.` };
}

/**
 * OWNER nunca é um destino válido (a campanha sempre tem exatamente uma) —
 * `memberRoleSchema` já restringe a CO_GM/PLAYER, e a linha do OWNER é
 * recusada abaixo mesmo que alguém tente contornar a UI.
 */
export async function updateCampaignMemberRoleAction(campaignId: string, memberId: string, role: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "OWNER");
  } catch (error) {
    if (error instanceof CampaignAccessError) return { error: error.message };
    throw error;
  }

  const parsedRole = memberRoleSchema.safeParse(role);
  if (!parsedRole.success) return { error: "Papel inválido." };

  const member = await db.campaignMember.findFirst({ where: { id: memberId, campaignId } });
  if (!member) return { error: "Membro não encontrado." };
  if (member.role === "OWNER") {
    return { error: "A Mestre da campanha não pode ter o papel alterado por aqui." };
  }

  await db.campaignMember.update({ where: { id: memberId }, data: { role: parsedRole.data } });
  revalidatePath(`/campaigns/${campaignId}/members`);
}

export async function removeCampaignMemberAction(campaignId: string, memberId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "OWNER");
  } catch (error) {
    if (error instanceof CampaignAccessError) return { error: error.message };
    throw error;
  }

  const member = await db.campaignMember.findFirst({ where: { id: memberId, campaignId } });
  if (!member) return;
  if (member.role === "OWNER") {
    return { error: "A Mestre da campanha não pode ser removida — a campanha sempre precisa de uma dona." };
  }

  await db.campaignMember.delete({ where: { id: memberId } });
  revalidatePath(`/campaigns/${campaignId}/members`);
}
