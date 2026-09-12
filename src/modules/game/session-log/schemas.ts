import { z } from "zod";

export const logEntryFormSchema = z.object({
  type: z.enum(["NOTE", "DICE_ROLL", "COMBAT_EVENT"]),
  content: z.string().trim().min(1, { error: "Escreva algo." }).max(2000, { error: "Máximo 2000 caracteres." }),
  clientId: z.string().trim().max(60).optional().or(z.literal("")),
  sessionPlanId: z.string().trim().max(60).optional().or(z.literal("")),
});

export type LogEntryFormInput = z.infer<typeof logEntryFormSchema>;
