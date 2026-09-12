import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getItemForUser } from "@/modules/gametools/items/queries";
import { updateItemAction } from "@/modules/gametools/items/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { ItemForm } from "@/components/items/item-form";

export const metadata: Metadata = { title: "Editar item" };

interface EditItemPageProps {
  params: Promise<{ campaignId: string; itemId: string }>;
}

export default async function EditItemPage({ params }: EditItemPageProps) {
  const { campaignId, itemId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const item = await getItemForUser(user.id, campaignId, itemId);
  if (!item) notFound();

  const tags = await listTagsForCampaign(campaignId);
  const action = updateItemAction.bind(null, campaignId, itemId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Editar {item.name}</h1>
      </div>
      <ItemForm
        campaignId={campaignId}
        action={action}
        submitLabel="Salvar alterações"
        defaultValues={item}
        availableTags={tags}
        defaultSelectedTagIds={item.tags.map((entry) => entry.tagId)}
      />
    </div>
  );
}
