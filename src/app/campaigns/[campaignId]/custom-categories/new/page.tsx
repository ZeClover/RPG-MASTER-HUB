import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getEnabledModuleKeys } from "@/modules/core/campaigns/module-settings";
import { createCategoryAction } from "@/modules/gametools/custom-categories/actions";
import { CategoryForm } from "@/components/custom-categories/category-form";

export const metadata: Metadata = { title: "Nova categoria" };

interface NewCategoryPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function NewCategoryPage({ params }: NewCategoryPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const enabledModuleKeys = await getEnabledModuleKeys(campaignId);
  if (!enabledModuleKeys.has("custom-categories")) notFound();

  const action = createCategoryAction.bind(null, campaignId);

  return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Nova categoria</h1>
        <p className="text-sm text-muted-foreground">
          Exemplos: Matéria Escolar, Artes Importantes, Regras da Casa, Facções Secretas, Rituais…
        </p>
      </div>
      <CategoryForm action={action} submitLabel="Criar categoria" />
    </div>
  );
}
