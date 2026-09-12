"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { relationshipsInvolvingEntity } from "@/modules/creation/relationships/queries";
import { getLocationDescendantIds, searchLocations } from "@/modules/creation/locations/queries";
import { locationFormSchema, type LocationFormInput } from "@/modules/creation/locations/schemas";

export type LocationFormState =
  | {
      errors?: Partial<Record<keyof LocationFormInput, string[]>>;
      message?: string;
    }
  | undefined;

function rawEntries(formData: FormData) {
  return {
    name: formData.get("name"),
    imageUrl: formData.get("imageUrl"),
    description: formData.get("description"),
    locationType: formData.get("locationType"),
    notes: formData.get("notes"),
    parentLocationId: formData.get("parentLocationId"),
    canonStatus: formData.get("canonStatus"),
    visibility: formData.get("visibility"),
  };
}

function n(value: string | undefined) {
  return value ? value : null;
}

function buildLocationData(data: LocationFormInput) {
  return {
    name: data.name,
    imageUrl: n(data.imageUrl),
    description: n(data.description),
    locationType: n(data.locationType),
    notes: n(data.notes),
    canonStatus: data.canonStatus,
    visibility: data.visibility,
  };
}

async function syncLocationTags(locationId: string, tagIds: string[]) {
  await db.locationTag.deleteMany({ where: { locationId, tagId: { notIn: tagIds } } });
  if (tagIds.length > 0) {
    await db.locationTag.createMany({ data: tagIds.map((tagId) => ({ locationId, tagId })), skipDuplicates: true });
  }
}

export async function createLocationAction(
  campaignId: string,
  _prevState: LocationFormState,
  formData: FormData,
): Promise<LocationFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = locationFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);
  const parentLocationId = parsed.data.parentLocationId || null;

  const location = await db.location.create({
    data: {
      ...buildLocationData(parsed.data),
      campaignId,
      parentLocationId,
      tags: tagIds.length > 0 ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
  });

  revalidatePath(`/campaigns/${campaignId}/locations`);
  redirect(`/campaigns/${campaignId}/locations/${location.id}`);
}

export async function updateLocationAction(
  campaignId: string,
  locationId: string,
  _prevState: LocationFormState,
  formData: FormData,
): Promise<LocationFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = locationFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const parentLocationId = parsed.data.parentLocationId || null;

  if (parentLocationId) {
    if (parentLocationId === locationId) {
      return { message: "Um local não pode ser pai de si mesmo." };
    }
    const descendants = await getLocationDescendantIds(locationId);
    if (descendants.has(parentLocationId)) {
      return { message: "Esse local é descendente deste — escolher ele como pai criaria um ciclo." };
    }
  }

  const tagIds = formData.getAll("tagIds").map(String);

  await db.location.update({
    where: { id: locationId },
    data: { ...buildLocationData(parsed.data), parentLocationId },
  });
  await syncLocationTags(locationId, tagIds);

  revalidatePath(`/campaigns/${campaignId}/locations`);
  revalidatePath(`/campaigns/${campaignId}/locations/${locationId}`);
  redirect(`/campaigns/${campaignId}/locations/${locationId}`);
}

export async function toggleLocationFavoriteAction(campaignId: string, locationId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const location = await db.location.findFirst({ where: { id: locationId, campaignId }, select: { favorite: true } });
  if (!location) return;

  await db.location.update({ where: { id: locationId }, data: { favorite: !location.favorite } });
  revalidatePath(`/campaigns/${campaignId}/locations`);
  revalidatePath(`/campaigns/${campaignId}/locations/${locationId}`);
}

export async function toggleLocationArchivedAction(campaignId: string, locationId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const location = await db.location.findFirst({ where: { id: locationId, campaignId }, select: { archived: true } });
  if (!location) return;

  await db.location.update({ where: { id: locationId }, data: { archived: !location.archived } });
  revalidatePath(`/campaigns/${campaignId}/locations`);
  revalidatePath(`/campaigns/${campaignId}/locations/${locationId}`);
}

export async function deleteLocationAction(campaignId: string, locationId: string): Promise<{ error?: string } | void> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const childCount = await db.location.count({ where: { parentLocationId: locationId } });
  if (childCount > 0) {
    return {
      error: `Este local tem ${childCount} ${childCount === 1 ? "sublocal" : "sublocais"}. Mova ou exclua os sublocais primeiro.`,
    };
  }

  await db.$transaction([
    db.relationship.deleteMany({ where: { campaignId, ...relationshipsInvolvingEntity("LOCATION", locationId) } }),
    db.location.delete({ where: { id: locationId } }),
  ]);

  revalidatePath(`/campaigns/${campaignId}/locations`);
  redirect(`/campaigns/${campaignId}/locations`);
}

export async function searchLocationsAction(campaignId: string, query: string, currentLocationId?: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId);
  return searchLocations(campaignId, query, currentLocationId);
}
