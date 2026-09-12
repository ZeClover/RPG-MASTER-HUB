import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const plotThreadFormSchema = z.object({
  title: z.string().trim().min(1, { error: "Informe um título." }).max(160, { error: "Máximo 160 caracteres." }),
  description: optionalText(4000),
  status: z.enum(["ACTIVE", "DORMANT", "RESOLVED", "ABANDONED"]),
  importance: z.enum(["LOW", "MEDIUM", "HIGH"]),
  visibility: z.enum(["GM_ONLY", "PLAYERS", "PUBLIC"]),
});

export type PlotThreadFormInput = z.infer<typeof plotThreadFormSchema>;
