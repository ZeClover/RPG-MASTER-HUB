import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const sessionPlanFormSchema = z.object({
  title: z.string().trim().min(1, { error: "Informe um título." }).max(160, { error: "Máximo 160 caracteres." }),
  sessionNumber: z
    .string()
    .trim()
    .regex(/^\d*$/, { error: "Informe um número." })
    .optional()
    .or(z.literal("")),
  plannedDate: optionalText(40),
  pitch: optionalText(500),
  gmNotes: optionalText(4000),
  status: z.enum(["PLANNING", "READY", "DONE", "CANCELLED"]),
});

export type SessionPlanFormInput = z.infer<typeof sessionPlanFormSchema>;

export const sceneFormSchema = z.object({
  title: z.string().trim().min(1, { error: "Informe um título." }).max(160, { error: "Máximo 160 caracteres." }),
  summary: optionalText(2000),
  readAloud: optionalText(2000),
  goal: optionalText(500),
  status: z.enum(["PLANNED", "PLAYED", "CUT"]),
});

export type SceneFormInput = z.infer<typeof sceneFormSchema>;

export const checklistItemFormSchema = z.object({
  label: z.string().trim().min(1, { error: "Informe um item." }).max(200, { error: "Máximo 200 caracteres." }),
});

export type ChecklistItemFormInput = z.infer<typeof checklistItemFormSchema>;
