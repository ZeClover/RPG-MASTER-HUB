import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const mysteryFormSchema = z.object({
  title: z.string().trim().min(1, { error: "Informe um título." }).max(160, { error: "Máximo 160 caracteres." }),
  description: optionalText(4000),
  status: z.enum(["OPEN", "RESOLVED"]),
  visibility: z.enum(["GM_ONLY", "PLAYERS", "PUBLIC"]),
});

export type MysteryFormInput = z.infer<typeof mysteryFormSchema>;

export const clueFormSchema = z.object({
  text: z.string().trim().min(1, { error: "Informe o texto da pista." }).max(500, { error: "Máximo 500 caracteres." }),
});

export type ClueFormInput = z.infer<typeof clueFormSchema>;
