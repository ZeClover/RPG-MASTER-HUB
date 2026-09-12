import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const lorePageFormSchema = z.object({
  title: z.string().trim().min(1, { error: "Informe um título." }).max(150, { error: "Máximo 150 caracteres." }),
  content: optionalText(20000),
  imageUrl: optionalText(2048),
  category: optionalText(80),
  canonStatus: z.enum(["DRAFT", "PROPOSED", "APPROVED", "CANON", "OBSOLETE", "ARCHIVED"]),
  visibility: z.enum(["GM_ONLY", "PLAYERS", "PUBLIC"]),
});

export type LorePageFormInput = z.infer<typeof lorePageFormSchema>;
