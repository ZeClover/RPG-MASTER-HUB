"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess } from "@/modules/core/permissions";
import { calendarFormSchema, type CalendarFormInput } from "@/modules/worldbuilding/calendar/schemas";

export type CalendarFormState =
  | {
      errors?: Partial<Record<keyof CalendarFormInput, string[]>>;
      message?: string;
    }
  | undefined;

export async function advanceCalendarDayAction(campaignId: string, delta: number) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const current = await db.campaignCalendar.findUnique({ where: { campaignId }, select: { currentDay: true } });
  const nextDay = Math.max(0, (current?.currentDay ?? 1) + delta);

  await db.campaignCalendar.upsert({
    where: { campaignId },
    update: { currentDay: nextDay },
    create: { campaignId, currentDay: nextDay },
  });

  revalidatePath(`/campaigns/${campaignId}/timeline`);
}

export async function updateCalendarAction(
  campaignId: string,
  _prevState: CalendarFormState,
  formData: FormData,
): Promise<CalendarFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = calendarFormSchema.safeParse({
    currentDay: formData.get("currentDay"),
    dayLabel: formData.get("dayLabel"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.campaignCalendar.upsert({
    where: { campaignId },
    update: { currentDay: parsed.data.currentDay, dayLabel: parsed.data.dayLabel },
    create: { campaignId, currentDay: parsed.data.currentDay, dayLabel: parsed.data.dayLabel },
  });

  revalidatePath(`/campaigns/${campaignId}/timeline`);
}
