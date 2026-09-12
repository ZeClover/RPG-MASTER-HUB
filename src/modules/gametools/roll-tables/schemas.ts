import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const rollTableFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Informe um nome." }).max(120, { error: "Máximo 120 caracteres." }),
  description: optionalText(2000),
});

export type RollTableFormInput = z.infer<typeof rollTableFormSchema>;

export const rollTableEntryFormSchema = z.object({
  label: z.string().trim().min(1, { error: "Informe o texto da entrada." }).max(300, { error: "Máximo 300 caracteres." }),
  weight: z.coerce.number().int().min(1, { error: "Peso mínimo 1." }).max(1000, { error: "Peso máximo 1000." }),
});

export type RollTableEntryFormInput = z.infer<typeof rollTableEntryFormSchema>;

/** 1-20 por rolagem: cobre de um único dado a uma leva razoável de itens de loot de uma vez. */
export const rollCountSchema = z.coerce.number().int().min(1).max(20);
