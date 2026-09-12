import { z } from "zod";

const optionalHexColor = z
  .union([z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, { error: "Cor inválida." }), z.literal("")])
  .optional();

export const tagInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Informe um nome para a tag." })
    .max(40, { error: "A tag pode ter no máximo 40 caracteres." }),
  color: optionalHexColor,
});

export type TagInput = z.infer<typeof tagInputSchema>;
