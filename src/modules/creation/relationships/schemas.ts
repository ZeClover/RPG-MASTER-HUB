import { z } from "zod";

export const relationshipFormSchema = z.object({
  targetType: z.enum(["NPC", "LOCATION", "FACTION", "LORE_PAGE"], { error: "Escolha o tipo do alvo." }),
  targetId: z.string().min(1, { error: "Selecione uma entidade." }),
  type: z
    .string()
    .trim()
    .min(1, { error: "Informe o tipo de relação." })
    .max(60, { error: "Máximo 60 caracteres." }),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  importance: z.enum(["LOW", "MEDIUM", "HIGH", ""]).default(""),
  visibility: z.enum(["GM_ONLY", "PLAYERS", "PUBLIC"]),
});

export type RelationshipFormInput = z.infer<typeof relationshipFormSchema>;
