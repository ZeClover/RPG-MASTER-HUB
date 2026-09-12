import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const locationFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Informe um nome." }).max(120, { error: "Máximo 120 caracteres." }),
  imageUrl: optionalText(2048),
  description: optionalText(4000),
  locationType: optionalText(80),
  notes: optionalText(4000),
  parentLocationId: optionalText(60),
  canonStatus: z.enum(["DRAFT", "PROPOSED", "APPROVED", "CANON", "OBSOLETE", "ARCHIVED"]),
  visibility: z.enum(["GM_ONLY", "PLAYERS", "PUBLIC"]),
});

export type LocationFormInput = z.infer<typeof locationFormSchema>;
