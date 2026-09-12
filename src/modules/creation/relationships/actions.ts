"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import type { RelatableEntityType } from "@/generated/prisma/client";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess } from "@/modules/core/permissions";
import { relationshipFormSchema } from "@/modules/creation/relationships/schemas";
import { searchEntitiesByType } from "@/modules/creation/relationships/queries";
import { getEntityHref } from "@/modules/creation/relationships/config";

export type RelationshipFormState = { error?: string } | undefined;

export async function createRelationshipAction(
  campaignId: string,
  sourceType: RelatableEntityType,
  sourceId: string,
  _prevState: RelationshipFormState,
  formData: FormData,
): Promise<RelationshipFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = relationshipFormSchema.safeParse({
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    type: formData.get("type"),
    description: formData.get("description"),
    importance: formData.get("importance") || "",
    visibility: formData.get("visibility"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { targetType, targetId, type, description, importance, visibility } = parsed.data;

  if (targetType === sourceType && targetId === sourceId) {
    return { error: "Uma entidade não pode se relacionar com ela mesma." };
  }

  await db.relationship.create({
    data: {
      campaignId,
      sourceType,
      sourceId,
      targetType,
      targetId,
      type,
      description: description || null,
      importance: importance || null,
      visibility,
    },
  });

  revalidatePath(getEntityHref(campaignId, sourceType, sourceId));
  revalidatePath(getEntityHref(campaignId, targetType, targetId));
}

export async function deleteRelationshipAction(relationshipId: string, campaignId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const relationship = await db.relationship.findFirst({ where: { id: relationshipId, campaignId } });
  if (!relationship) return;

  await db.relationship.delete({ where: { id: relationshipId } });

  revalidatePath(getEntityHref(campaignId, relationship.sourceType, relationship.sourceId));
  revalidatePath(getEntityHref(campaignId, relationship.targetType, relationship.targetId));
}

export async function searchRelatableEntitiesAction(
  campaignId: string,
  type: RelatableEntityType,
  query: string,
  excludeIds: string[] = [],
) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId);
  return searchEntitiesByType(campaignId, type, query, excludeIds);
}
