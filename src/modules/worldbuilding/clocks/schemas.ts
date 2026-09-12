import { z } from "zod";

export const CLOCK_SEGMENT_OPTIONS = [4, 6, 8, 10, 12] as const;

export const clockFormSchema = z.object({
  title: z.string().trim().min(1, { error: "Informe um título." }).max(120, { error: "Máximo 120 caracteres." }),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  segments: z.coerce.number().int().min(2, { error: "Mínimo 2 segmentos." }).max(12, { error: "Máximo 12 segmentos." }),
});

export type ClockFormInput = z.infer<typeof clockFormSchema>;
