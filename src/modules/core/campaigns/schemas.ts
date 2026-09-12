import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, { error: "Use uma cor hexadecimal válida (#rrggbb)." });

const optionalHexColor = z.union([hexColor, z.literal("")]).optional();

// Aceita tanto URLs absolutas (Vercel Blob em produção) quanto caminhos
// relativos como "/uploads/..." (storage local em desenvolvimento) — o valor
// vem sempre do nosso próprio endpoint de upload, nunca digitado pelo usuário.
const optionalUploadPath = z.string().max(2048).optional().or(z.literal(""));

export const campaignFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "O nome precisa ter ao menos 2 caracteres." })
    .max(120, { error: "O nome pode ter no máximo 120 caracteres." }),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  imageUrl: optionalUploadPath,
  bannerUrl: optionalUploadPath,
  iconUrl: optionalUploadPath,
  symbolUrl: optionalUploadPath,
  backgroundUrl: optionalUploadPath,
  primaryColor: optionalHexColor,
  secondaryColor: optionalHexColor,
  nextSessionAt: z.string().optional().or(z.literal("")),
});

export type CampaignFormInput = z.infer<typeof campaignFormSchema>;
