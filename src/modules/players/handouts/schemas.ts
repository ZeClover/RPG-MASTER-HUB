import { z } from "zod";

export const handoutFormSchema = z.object({
  title: z.string().trim().min(1, { error: "Informe um título." }).max(120, { error: "Máximo 120 caracteres." }),
  content: z.string().trim().max(4000, { error: "Máximo 4000 caracteres." }).optional(),
  imageUrl: z.string().trim().optional(),
});

export type HandoutFormInput = z.infer<typeof handoutFormSchema>;
