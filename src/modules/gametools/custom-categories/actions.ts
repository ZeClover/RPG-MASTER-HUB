"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import {
  customCategoryFormSchema,
  type CustomCategoryFormInput,
} from "@/modules/gametools/custom-categories/schemas";

export type CustomCategoryFormState =
  | {
      errors?: Partial<Record<keyof CustomCategoryFormInput, string[]>>;
      message?: string;
    }
  | undefined;

function n(value: string | undefined) {
  return value ? value : null;
}

function parseCategoryForm(formData: FormData) {
  return customCategoryFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
}

export async function createCategoryAction(
  campaignId: string,
  _prevState: CustomCategoryFormState,
  formData: FormData,
): Promise<CustomCategoryFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = parseCategoryForm(formData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const category = await db.customCategory.create({
    data: { campaignId, name: parsed.data.name, description: n(parsed.data.description) },
  });

  revalidatePath(`/campaigns/${campaignId}/custom-categories`);
  redirect(`/campaigns/${campaignId}/custom-categories/${category.id}`);
}

/** Sem página de edição própria — renomear é um formulário inline na página de detalhe (ver spec da Fase 10). */
export async function updateCategoryAction(
  campaignId: string,
  categoryId: string,
  _prevState: CustomCategoryFormState,
  formData: FormData,
): Promise<CustomCategoryFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = parseCategoryForm(formData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  // Escopado por campaignId (não só por id) — categoryId chega como argumento
  // de Server Action, não confiar que já pertence a esta campanha só porque
  // quem chamou é CO_GM/OWNER dela (mesmo raciocínio de `entry-actions.ts`).
  await db.customCategory.updateMany({
    where: { id: categoryId, campaignId },
    data: { name: parsed.data.name, description: n(parsed.data.description) },
  });

  revalidatePath(`/campaigns/${campaignId}/custom-categories`);
  revalidatePath(`/campaigns/${campaignId}/custom-categories/${categoryId}`);
  return { message: "Categoria atualizada." };
}

export async function deleteCategoryAction(campaignId: string, categoryId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return;
    throw error;
  }

  await db.customCategory.deleteMany({ where: { id: categoryId, campaignId } });
  revalidatePath(`/campaigns/${campaignId}/custom-categories`);
  redirect(`/campaigns/${campaignId}/custom-categories`);
}
