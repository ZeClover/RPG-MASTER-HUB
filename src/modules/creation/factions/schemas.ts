import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const factionFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Informe um nome." }).max(120, { error: "Máximo 120 caracteres." }),
  imageUrl: optionalText(2048),
  factionType: optionalText(80),
  description: optionalText(4000),
  history: optionalText(4000),
  goals: optionalText(2000),
  resources: optionalText(2000),
  secrets: optionalText(2000),
  notes: optionalText(2000),
  canonStatus: z.enum(["DRAFT", "PROPOSED", "APPROVED", "CANON", "OBSOLETE", "ARCHIVED"]),
  visibility: z.enum(["GM_ONLY", "PLAYERS", "PUBLIC"]),
});

export type FactionFormInput = z.infer<typeof factionFormSchema>;
