import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const npcFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Informe um nome." }).max(120, { error: "Máximo 120 caracteres." }),
  imageUrl: optionalText(2048),
  age: optionalText(60),
  species: optionalText(80),
  gender: optionalText(60),
  appearance: optionalText(4000),
  personality: optionalText(4000),
  history: optionalText(4000),
  goals: optionalText(2000),
  fears: optionalText(2000),
  secrets: optionalText(2000),
  narrativeStatus: optionalText(60),
  gmNotes: optionalText(4000),
  canonStatus: z.enum(["DRAFT", "PROPOSED", "APPROVED", "CANON", "OBSOLETE", "ARCHIVED"]),
  visibility: z.enum(["GM_ONLY", "PLAYERS", "PUBLIC"]),
});

export type NpcFormInput = z.infer<typeof npcFormSchema>;
