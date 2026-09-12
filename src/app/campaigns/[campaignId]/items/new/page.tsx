import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { createItemAction } from "@/modules/gametools/items/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { ItemForm } from "@/components/items/item-form";

export const metadata: Metadata = { title: "Novo item" };

interface NewItemPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function NewItemPage({ params }: NewItemPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const tags = await listTagsForCampaign(campaignId);
  const action = createItemAction.bind(null, campaignId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Novo item</h1>
        <p className="text-sm text-muted-foreground">Só o nome é obrigatório.</p>
      </div>
      <ItemForm campaignId={campaignId} action={action} submitLabel="Criar item" availableTags={tags} />
    </div>
  );
}
