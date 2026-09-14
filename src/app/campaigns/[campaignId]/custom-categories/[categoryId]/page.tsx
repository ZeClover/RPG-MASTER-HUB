import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getEnabledModuleKeys } from "@/modules/core/campaigns/module-settings";
import { getCategoryForUser } from "@/modules/gametools/custom-categories/queries";
import { updateCategoryAction } from "@/modules/gametools/custom-categories/actions";
import { CategoryForm } from "@/components/custom-categories/category-form";
import { DeleteCategoryButton } from "@/components/custom-categories/delete-category-button";
import { EntryList } from "@/components/custom-categories/entry-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryDetailPageProps {
  params: Promise<{ campaignId: string; categoryId: string }>;
}

export async function generateMetadata({ params }: CategoryDetailPageProps): Promise<Metadata> {
  const { campaignId, categoryId } = await params;
  const user = await requireUser();
  const category = await getCategoryForUser(user.id, campaignId, categoryId).catch(() => null);
  return { title: category?.name ?? "Categoria" };
}

export default async function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const { campaignId, categoryId } = await params;
  const user = await requireUser();

  let role;
  try {
    ({ role } = await requireCampaignAccess(user.id, campaignId));
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const enabledModuleKeys = await getEnabledModuleKeys(campaignId);
  if (!enabledModuleKeys.has("custom-categories")) notFound();

  const category = await getCategoryForUser(user.id, campaignId, categoryId);
  if (!category) notFound();

  const canManage = role === "CO_GM" || role === "OWNER";
  const updateAction = updateCategoryAction.bind(null, campaignId, categoryId);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">{category.name}</h1>
          {category.description && <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>}
        </div>
        {canManage && <DeleteCategoryButton campaignId={campaignId} categoryId={categoryId} categoryName={category.name} />}
      </div>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Editar categoria</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CategoryForm
              action={updateAction}
              submitLabel="Salvar alterações"
              defaultValues={{ name: category.name, description: category.description }}
            />
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Entradas</h2>
        <EntryList campaignId={campaignId} categoryId={categoryId} entries={category.entries} canManage={canManage} />
      </div>
    </div>
  );
}
