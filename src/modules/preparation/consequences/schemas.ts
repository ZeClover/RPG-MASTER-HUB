import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const consequenceFormSchema = z.object({
  title: z.string().trim().min(1, { error: "Informe um título." }).max(200, { error: "Máximo 200 caracteres." }),
  trigger: optionalText(1000),
  description: optionalText(4000),
  status: z.enum(["PENDING", "TRIGGERED", "RESOLVED"]),
  visibility: z.enum(["GM_ONLY", "PLAYERS", "PUBLIC"]),
});

export type ConsequenceFormInput = z.infer<typeof consequenceFormSchema>;
