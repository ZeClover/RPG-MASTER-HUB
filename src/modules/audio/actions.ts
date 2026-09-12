"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess } from "@/modules/core/permissions";
import {
  audioTrackFormSchema,
  discordLinkFormSchema,
  type AudioTrackFormInput,
  type DiscordLinkFormInput,
} from "@/modules/audio/schemas";

export type AudioTrackFormState =
  | {
      errors?: Partial<Record<keyof AudioTrackFormInput, string[]>>;
      message?: string;
    }
  | undefined;

export type DiscordLinkFormState =
  | {
      errors?: Partial<Record<keyof DiscordLinkFormInput, string[]>>;
      message?: string;
    }
  | undefined;

export async function createAudioTrackAction(
  campaignId: string,
  _prevState: AudioTrackFormState,
  formData: FormData,
): Promise<AudioTrackFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = audioTrackFormSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    fileUrl: formData.get("fileUrl"),
    // Checkbox desmarcado manda `formData.get` retornar `null`, não `undefined` — `z.string().optional()`
    // só aceita o segundo (bug pré-existente descoberto na Fase 7, ver ARCHITECTURE.md, seção 18.5).
    loop: formData.get("loop") || undefined,
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.audioTrack.create({
    data: {
      campaignId,
      name: parsed.data.name,
      category: parsed.data.category,
      fileUrl: parsed.data.fileUrl,
      loop: parsed.data.loop === "on",
    },
  });

  revalidatePath(`/campaigns/${campaignId}/audio`);
}

export async function deleteAudioTrackAction(campaignId: string, trackId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.audioTrack.delete({ where: { id: trackId } });

  revalidatePath(`/campaigns/${campaignId}/audio`);
}

export async function playMusicAction(campaignId: string, trackId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.musicPlaybackState.upsert({
    where: { campaignId },
    update: { trackId, isPlaying: true },
    create: { campaignId, trackId, isPlaying: true },
  });

  revalidatePath(`/campaigns/${campaignId}/audio`);
}

export async function stopMusicAction(campaignId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.musicPlaybackState.upsert({
    where: { campaignId },
    update: { isPlaying: false },
    create: { campaignId, isPlaying: false },
  });

  revalidatePath(`/campaigns/${campaignId}/audio`);
}

export async function triggerSfxAction(campaignId: string, trackId: string) {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  await db.sfxTriggerEvent.create({ data: { campaignId, trackId } });

  revalidatePath(`/campaigns/${campaignId}/audio`);
}

export async function saveDiscordLinkAction(
  campaignId: string,
  _prevState: DiscordLinkFormState,
  formData: FormData,
): Promise<DiscordLinkFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "OWNER");

  const parsed = discordLinkFormSchema.safeParse({
    guildId: formData.get("guildId"),
    voiceChannelId: formData.get("voiceChannelId"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.discordLink.upsert({
    where: { campaignId },
    update: { guildId: parsed.data.guildId, voiceChannelId: parsed.data.voiceChannelId },
    create: { campaignId, guildId: parsed.data.guildId, voiceChannelId: parsed.data.voiceChannelId },
  });

  revalidatePath(`/campaigns/${campaignId}/audio`);
}
