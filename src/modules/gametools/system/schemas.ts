import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

const optionalHexColor = z
  .union([z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, { error: "Cor inválida." }), z.literal("")])
  .optional();

export const attributeDefFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Informe um nome." }).max(60, { error: "Máximo 60 caracteres." }),
  description: optionalText(500),
  defaultValue: z.coerce.number().int().min(-999).max(999),
  // Checkbox desmarcado manda `formData.get` retornar `null` (não `undefined`) — `z.string().optional()` só
  // aceita o segundo (mesmo bug pré-existente de `MonsterForm`, ver ARCHITECTURE.md, seção 18.5).
  gmOnly: z.string().optional(),
});
export type AttributeDefFormInput = z.infer<typeof attributeDefFormSchema>;

export const resourceDefFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Informe um nome." }).max(60, { error: "Máximo 60 caracteres." }),
  description: optionalText(500),
  defaultMax: z.coerce.number().int().min(0).max(9999),
  gmOnly: z.string().optional(),
});
export type ResourceDefFormInput = z.infer<typeof resourceDefFormSchema>;

export const skillDefFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Informe um nome." }).max(60, { error: "Máximo 60 caracteres." }),
  relatedAttributeId: optionalText(60),
  defaultBonus: z.coerce.number().int().min(-999).max(999),
  gmOnly: z.string().optional(),
});
export type SkillDefFormInput = z.infer<typeof skillDefFormSchema>;

export const conditionDefFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Informe um nome." }).max(60, { error: "Máximo 60 caracteres." }),
  description: optionalText(500),
  color: optionalHexColor,
});
export type ConditionDefFormInput = z.infer<typeof conditionDefFormSchema>;

export const rollFormulaDefFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Informe um nome." }).max(80, { error: "Máximo 80 caracteres." }),
  formula: z.string().trim().min(1, { error: "Informe a fórmula." }).max(300, { error: "Máximo 300 caracteres." }),
  description: optionalText(500),
});
export type RollFormulaDefFormInput = z.infer<typeof rollFormulaDefFormSchema>;

export const SHEET_SECTION_KINDS = ["ATTRIBUTES", "RESOURCES", "SKILLS", "CONDITIONS", "FORMULAS", "CUSTOM_TEXT"] as const;

export const sheetSectionFormSchema = z
  .object({
    kind: z.enum(SHEET_SECTION_KINDS, { error: "Selecione um tipo de seção." }),
    title: z.string().trim().min(1, { error: "Informe um título." }).max(80, { error: "Máximo 80 caracteres." }),
    customText: optionalText(4000),
    gmOnly: z.string().optional(),
  })
  .refine((data) => data.kind !== "CUSTOM_TEXT" || Boolean(data.customText), {
    error: "Informe o texto da seção.",
    path: ["customText"],
  });
export type SheetSectionFormInput = z.infer<typeof sheetSectionFormSchema>;
