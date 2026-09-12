import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getLorePageForUser } from "@/modules/creation/lore/queries";
import { updateLorePageAction } from "@/modules/creation/lore/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { LoreForm } from "@/components/lore/lore-form";

export const metadata: Metadata = { title: "Editar página de lore" };

interface EditLorePageProps {
  params: Promise<{ campaignId: string; lorePageId: string }>;
}

export default async function EditLorePage({ params }: EditLorePageProps) {
  const { campaignId, lorePageId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const lorePage = await getLorePageForUser(user.id, campaignId, lorePageId);
  if (!lorePage) notFound();

  const tags = await listTagsForCampaign(campaignId);
  const action = updateLorePageAction.bind(null, campaignId, lorePageId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Editar {lorePage.title}</h1>
      </div>
      <LoreForm
        campaignId={campaignId}
        action={action}
        submitLabel="Salvar alterações"
        defaultValues={lorePage}
        availableTags={tags}
        defaultSelectedTagIds={lorePage.tags.map((entry) => entry.tagId)}
      />
    </div>
  );
}
