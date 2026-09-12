import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const questFormSchema = z.object({
  title: z.string().trim().min(1, { error: "Informe um título." }).max(160, { error: "Máximo 160 caracteres." }),
  description: optionalText(4000),
  objective: optionalText(1000),
  reward: optionalText(1000),
  status: z.enum(["NOT_STARTED", "ACTIVE", "COMPLETED", "FAILED", "ABANDONED"]),
  visibility: z.enum(["GM_ONLY", "PLAYERS", "PUBLIC"]),
});

export type QuestFormInput = z.infer<typeof questFormSchema>;
