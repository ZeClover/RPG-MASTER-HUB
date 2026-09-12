import { z } from "zod";

export const quickIdeaSchema = z.object({
  title: z.string().trim().min(1, { error: "Escreva alguma coisa." }).max(150),
});

export const ideaFormSchema = z.object({
  title: z.string().trim().min(1, { error: "Informe um título." }).max(150, { error: "Máximo 150 caracteres." }),
  content: z.string().trim().max(4000).optional().or(z.literal("")),
  state: z.enum(["NEW", "INTERESTING", "DEVELOPING", "USED", "ARCHIVED", "DISCARDED"]),
});

export type IdeaFormInput = z.infer<typeof ideaFormSchema>;
