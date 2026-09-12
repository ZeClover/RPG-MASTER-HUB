import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const timelineEventFormSchema = z.object({
  title: z.string().trim().min(1, { error: "Informe um título." }).max(160, { error: "Máximo 160 caracteres." }),
  narrativeDate: optionalText(80),
  description: optionalText(4000),
  visibility: z.enum(["GM_ONLY", "PLAYERS", "PUBLIC"]),
});

export type TimelineEventFormInput = z.infer<typeof timelineEventFormSchema>;
