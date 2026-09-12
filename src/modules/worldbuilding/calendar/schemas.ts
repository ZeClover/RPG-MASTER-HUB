import { z } from "zod";

export const calendarFormSchema = z.object({
  currentDay: z.coerce.number().int().min(0, { error: "O dia não pode ser negativo." }).max(1_000_000),
  dayLabel: z
    .string()
    .trim()
    .min(1, { error: "Informe um rótulo." })
    .max(40, { error: "Máximo 40 caracteres." }),
});

export type CalendarFormInput = z.infer<typeof calendarFormSchema>;
