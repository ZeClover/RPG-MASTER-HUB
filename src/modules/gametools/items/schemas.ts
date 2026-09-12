import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const itemFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Informe um nome." }).max(120, { error: "Máximo 120 caracteres." }),
  imageUrl: optionalText(2048),
  category: optionalText(120),
  description: optionalText(4000),
  effect: optionalText(2000),
  canonStatus: z.enum(["DRAFT", "PROPOSED", "APPROVED", "CANON", "OBSOLETE", "ARCHIVED"]),
  visibility: z.enum(["GM_ONLY", "PLAYERS", "PUBLIC"]),
});

export type ItemFormInput = z.infer<typeof itemFormSchema>;
