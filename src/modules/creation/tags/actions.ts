"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess } from "@/modules/core/permissions";
import { tagInputSchema } from "@/modules/creation/tags/schemas";
import { slugifyTagName } from "@/modules/creation/tags/slug";

export async function createTagAction(campaignId: string, rawName: string, rawColor?: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = tagInputSchema.safeParse({ name: rawName, color: rawColor ?? "" });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nome de tag inválido." };
  }

  const slug = slugifyTagName(parsed.data.name);
  if (!slug) {
    return { error: "Nome de tag inválido." };
  }

  // Evita duplicar tags equivalentes (mesmo slug) dentro da campanha —
  // se já existe, devolve a existente em vez de criar uma nova.
  const existing = await db.tag.findUnique({ where: { campaignId_slug: { campaignId, slug } } });
  if (existing) {
    return { tag: existing };
  }

  const tag = await db.tag.create({
    data: { campaignId, name: parsed.data.name, slug, color: parsed.data.color || null },
  });

  return { tag };
}

export async function renameTagAction(tagId: string, campaignId: string, rawName: string, rawColor?: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = tagInputSchema.safeParse({ name: rawName, color: rawColor ?? "" });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Nome de tag inválido." };
  }

  const slug = slugifyTagName(parsed.data.name);
  const conflict = await db.tag.findFirst({ where: { campaignId, slug, NOT: { id: tagId } } });
  if (conflict) {
    return { error: "Já existe uma tag equivalente com esse nome." };
  }

  await db.tag.update({
    where: { id: tagId },
    data: { name: parsed.data.name, slug, color: parsed.data.color || null },
  });

  revalidatePath(`/campaigns/${campaignId}/tags`);
  return { success: true as const };
}

export async function deleteTagAction(tagId: string, campaignId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.tag.delete({ where: { id: tagId } });
  revalidatePath(`/campaigns/${campaignId}/tags`);
}
