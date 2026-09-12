import { z } from "zod";

export const audioTrackFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Informe um nome." }).max(120, { error: "Máximo 120 caracteres." }),
  category: z.enum(["MUSIC", "SFX"]),
  fileUrl: z.string().trim().min(1, { error: "Envie um arquivo de áudio." }),
  loop: z.string().optional(),
});

export type AudioTrackFormInput = z.infer<typeof audioTrackFormSchema>;

export const discordLinkFormSchema = z.object({
  guildId: z.string().trim().min(1, { error: "Informe o ID do servidor." }).max(32, { error: "Máximo 32 caracteres." }),
  voiceChannelId: z
    .string()
    .trim()
    .min(1, { error: "Informe o ID do canal de voz." })
    .max(32, { error: "Máximo 32 caracteres." }),
});

export type DiscordLinkFormInput = z.infer<typeof discordLinkFormSchema>;
