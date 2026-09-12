import { z } from "zod";

export const combatantFormSchema = z.object({
  id: z.string().trim().min(1, { error: "Id inválido." }),
  name: z.string().trim().min(1, { error: "Informe um nome." }).max(120, { error: "Máximo 120 caracteres." }),
  type: z.enum(["PC", "NPC"]),
  initiative: z.coerce.number().int().min(-99).max(99).default(0),
  hpMax: z.coerce.number().int().min(0).max(9999).optional(),
});

export type CombatantFormInput = z.infer<typeof combatantFormSchema>;

export const combatantUpdateSchema = z.object({
  hpCurrent: z.coerce.number().int().min(-9999).max(9999).optional(),
  hpMax: z.coerce.number().int().min(0).max(9999).optional(),
  initiative: z.coerce.number().int().min(-99).max(99).optional(),
  conditions: z.string().trim().max(200).optional().or(z.literal("")),
});

export type CombatantUpdateInput = z.infer<typeof combatantUpdateSchema>;
