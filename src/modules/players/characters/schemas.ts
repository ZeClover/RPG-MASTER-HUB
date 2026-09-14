import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const characterFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Informe um nome." }).max(80, { error: "Máximo 80 caracteres." }),
  concept: optionalText(200),
  imageUrl: optionalText(2048),
  bio: optionalText(4000),
  // Só aplicado quando quem envia é CO_GM/OWNER — checado no servidor, nunca
  // confiando em o campo estar presente/ausente no form (ver actions.ts).
  gmNotes: optionalText(2000),
});

export type CharacterFormInput = z.infer<typeof characterFormSchema>;
