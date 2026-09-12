"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { campaignFormSchema, type CampaignFormInput } from "@/modules/core/campaigns/schemas";

export type CampaignFormState =
  | {
      errors?: Partial<Record<keyof CampaignFormInput, string[]>>;
      message?: string;
    }
  | undefined;

function rawFormEntries(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    bannerUrl: formData.get("bannerUrl"),
    iconUrl: formData.get("iconUrl"),
    symbolUrl: formData.get("symbolUrl"),
    backgroundUrl: formData.get("backgroundUrl"),
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    nextSessionAt: formData.get("nextSessionAt"),
  };
}

function emptyToNull(value: string | undefined) {
  return value ? value : null;
}

function buildCampaignData(data: CampaignFormInput) {
  return {
    name: data.name,
    description: emptyToNull(data.description),
    imageUrl: emptyToNull(data.imageUrl),
    bannerUrl: emptyToNull(data.bannerUrl),
    iconUrl: emptyToNull(data.iconUrl),
    symbolUrl: emptyToNull(data.symbolUrl),
    backgroundUrl: emptyToNull(data.backgroundUrl),
    primaryColor: emptyToNull(data.primaryColor),
    secondaryColor: emptyToNull(data.secondaryColor),
    nextSessionAt: data.nextSessionAt ? new Date(data.nextSessionAt) : null,
  };
}

export async function createCampaignAction(
  _prevState: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const user = await requireUser();

  const parsed = campaignFormSchema.safeParse(rawFormEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const campaign = await db.campaign.create({
    data: {
      ...buildCampaignData(parsed.data),
      ownerId: user.id,
      members: {
        create: { userId: user.id, role: "OWNER" },
      },
    },
  });

  revalidatePath("/home");
  redirect(`/campaigns/${campaign.id}/dashboard`);
}

export async function updateCampaignAction(
  campaignId: string,
  _prevState: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "OWNER");

  const parsed = campaignFormSchema.safeParse(rawFormEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.campaign.update({
    where: { id: campaignId },
    data: buildCampaignData(parsed.data),
  });

  revalidatePath("/home");
  revalidatePath(`/campaigns/${campaignId}`);
  return { message: "Campanha atualizada." };
}

export async function archiveCampaignAction(campaignId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "OWNER");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  await db.campaign.update({
    where: { id: campaignId },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });

  revalidatePath("/home");
  redirect("/home");
}

export async function unarchiveCampaignAction(campaignId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "OWNER");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  await db.campaign.update({
    where: { id: campaignId },
    data: { status: "ACTIVE", archivedAt: null },
  });

  revalidatePath("/home");
}
