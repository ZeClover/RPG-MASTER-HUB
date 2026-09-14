import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const customCategoryFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Informe um nome." }).max(120, { error: "Máximo 120 caracteres." }),
  description: optionalText(2000),
});

export type CustomCategoryFormInput = z.infer<typeof customCategoryFormSchema>;

export const customCategoryEntryFormSchema = z.object({
  title: z.string().trim().min(1, { error: "Informe um título." }).max(150, { error: "Máximo 150 caracteres." }),
  content: optionalText(4000),
  imageUrl: optionalText(2048),
  visibility: z.enum(["GM_ONLY", "PLAYERS", "PUBLIC"]),
});

export type CustomCategoryEntryFormInput = z.infer<typeof customCategoryEntryFormSchema>;
