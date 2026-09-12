"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { relationshipsInvolvingEntity } from "@/modules/creation/relationships/queries";
import { timelineEventFormSchema, type TimelineEventFormInput } from "@/modules/worldbuilding/timeline/schemas";

export type TimelineEventFormState =
  | {
      errors?: Partial<Record<keyof TimelineEventFormInput, string[]>>;
      message?: string;
    }
  | undefined;

function rawEntries(formData: FormData) {
  return {
    title: formData.get("title"),
    narrativeDate: formData.get("narrativeDate"),
    description: formData.get("description"),
    visibility: formData.get("visibility"),
  };
}

function n(value: string | undefined) {
  return value ? value : null;
}

function buildTimelineEventData(data: TimelineEventFormInput) {
  return {
    title: data.title,
    narrativeDate: n(data.narrativeDate),
    description: n(data.description),
    visibility: data.visibility,
  };
}

async function syncTimelineEventTags(timelineEventId: string, tagIds: string[]) {
  await db.timelineEventTag.deleteMany({ where: { timelineEventId, tagId: { notIn: tagIds } } });
  if (tagIds.length > 0) {
    await db.timelineEventTag.createMany({
      data: tagIds.map((tagId) => ({ timelineEventId, tagId })),
      skipDuplicates: true,
    });
  }
}

export async function createTimelineEventAction(
  campaignId: string,
  _prevState: TimelineEventFormState,
  formData: FormData,
): Promise<TimelineEventFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = timelineEventFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  const last = await db.timelineEvent.findFirst({
    where: { campaignId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const event = await db.timelineEvent.create({
    data: {
      ...buildTimelineEventData(parsed.data),
      campaignId,
      order: (last?.order ?? -1) + 1,
      tags: tagIds.length > 0 ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    },
  });

  revalidatePath(`/campaigns/${campaignId}/timeline`);
  redirect(`/campaigns/${campaignId}/timeline/${event.id}`);
}

export async function updateTimelineEventAction(
  campaignId: string,
  eventId: string,
  _prevState: TimelineEventFormState,
  formData: FormData,
): Promise<TimelineEventFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = timelineEventFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const tagIds = formData.getAll("tagIds").map(String);

  await db.timelineEvent.update({ where: { id: eventId }, data: buildTimelineEventData(parsed.data) });
  await syncTimelineEventTags(eventId, tagIds);

  revalidatePath(`/campaigns/${campaignId}/timeline`);
  revalidatePath(`/campaigns/${campaignId}/timeline/${eventId}`);
  redirect(`/campaigns/${campaignId}/timeline/${eventId}`);
}

export async function toggleTimelineEventFavoriteAction(campaignId: string, eventId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const event = await db.timelineEvent.findFirst({ where: { id: eventId, campaignId }, select: { favorite: true } });
  if (!event) return;

  await db.timelineEvent.update({ where: { id: eventId }, data: { favorite: !event.favorite } });
  revalidatePath(`/campaigns/${campaignId}/timeline`);
  revalidatePath(`/campaigns/${campaignId}/timeline/${eventId}`);
}

export async function toggleTimelineEventArchivedAction(campaignId: string, eventId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const event = await db.timelineEvent.findFirst({ where: { id: eventId, campaignId }, select: { archived: true } });
  if (!event) return;

  await db.timelineEvent.update({ where: { id: eventId }, data: { archived: !event.archived } });
  revalidatePath(`/campaigns/${campaignId}/timeline`);
  revalidatePath(`/campaigns/${campaignId}/timeline/${eventId}`);
}

export async function moveTimelineEventAction(campaignId: string, eventId: string, direction: "up" | "down") {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  const events = await db.timelineEvent.findMany({
    where: { campaignId, archived: false },
    orderBy: { order: "asc" },
  });
  const index = events.findIndex((event) => event.id === eventId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= events.length) return;

  const current = events[index];
  const neighbor = events[swapIndex];

  await db.$transaction([
    db.timelineEvent.update({ where: { id: current.id }, data: { order: neighbor.order } }),
    db.timelineEvent.update({ where: { id: neighbor.id }, data: { order: current.order } }),
  ]);

  revalidatePath(`/campaigns/${campaignId}/timeline`);
}

export async function deleteTimelineEventAction(campaignId: string, eventId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.$transaction([
    db.relationship.deleteMany({
      where: { campaignId, ...relationshipsInvolvingEntity("TIMELINE_EVENT", eventId) },
    }),
    db.timelineEvent.delete({ where: { id: eventId } }),
  ]);

  revalidatePath(`/campaigns/${campaignId}/timeline`);
  redirect(`/campaigns/${campaignId}/timeline`);
}
