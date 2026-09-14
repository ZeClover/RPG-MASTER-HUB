import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getEnabledModuleKeys } from "@/modules/core/campaigns/module-settings";
import { listCategories } from "@/modules/gametools/custom-categories/queries";
import { Button } from "@/components/ui/button";
import { CategoryList } from "@/components/custom-categories/category-list";

export const metadata: Metadata = { title: "Categorias Personalizadas" };

interface CustomCategoriesPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function CustomCategoriesPage({ params }: CustomCategoriesPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  let role;
  try {
    ({ role } = await requireCampaignAccess(user.id, campaignId));
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  // Módulo desligado por padrão — proteção contra acesso direto por URL
  // enquanto o mestre não liga em Configurações → Módulos (Fase 10, ver
  // ARCHITECTURE.md, seção 21).
  const enabledModuleKeys = await getEnabledModuleKeys(campaignId);
  if (!enabledModuleKeys.has("custom-categories")) notFound();

  const canManage = role === "CO_GM" || role === "OWNER";
  const categories = await listCategories(user.id, campaignId);
  const newHref = `/campaigns/${campaignId}/custom-categories/new`;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Categorias Personalizadas</h1>
          <p className="text-sm text-muted-foreground">
            Crie categorias próprias — matéria escolar, artes importantes, ou o que a sua campanha precisar.
          </p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href={newHref}>
              <Plus className="size-4" /> Nova categoria
            </Link>
          </Button>
        )}
      </div>

      <CategoryList
        campaignId={campaignId}
        categories={categories}
        emptyStateAction={
          canManage ? (
            <Button asChild>
              <Link href={newHref}>
                <Plus className="size-4" /> Criar primeira categoria
              </Link>
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
