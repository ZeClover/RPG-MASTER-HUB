import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const monsterFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Informe um nome." }).max(120, { error: "Máximo 120 caracteres." }),
  imageUrl: optionalText(2048),
  isBoss: z.string().optional(),
  description: optionalText(4000),
  canonStatus: z.enum(["DRAFT", "PROPOSED", "APPROVED", "CANON", "OBSOLETE", "ARCHIVED"]),
  visibility: z.enum(["GM_ONLY", "PLAYERS", "PUBLIC"]),
});

export type MonsterFormInput = z.infer<typeof monsterFormSchema>;

export const monsterAttributeFormSchema = z.object({
  key: z.string().trim().min(1, { error: "Informe o nome do atributo." }).max(60, { error: "Máximo 60 caracteres." }),
  value: z.string().trim().min(1, { error: "Informe o valor." }).max(200, { error: "Máximo 200 caracteres." }),
});

export type MonsterAttributeFormInput = z.infer<typeof monsterAttributeFormSchema>;
