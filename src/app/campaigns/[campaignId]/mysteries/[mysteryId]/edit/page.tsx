import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getMysteryForUser } from "@/modules/worldbuilding/mysteries/queries";
import { updateMysteryAction } from "@/modules/worldbuilding/mysteries/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { MysteryForm } from "@/components/mysteries/mystery-form";

export const metadata: Metadata = { title: "Editar mistério" };

interface EditMysteryPageProps {
  params: Promise<{ campaignId: string; mysteryId: string }>;
}

export default async function EditMysteryPage({ params }: EditMysteryPageProps) {
  const { campaignId, mysteryId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const mystery = await getMysteryForUser(user.id, campaignId, mysteryId);
  if (!mystery) notFound();

  const tags = await listTagsForCampaign(campaignId);
  const action = updateMysteryAction.bind(null, campaignId, mysteryId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Editar {mystery.title}</h1>
      </div>
      <MysteryForm
        campaignId={campaignId}
        action={action}
        submitLabel="Salvar alterações"
        defaultValues={mystery}
        availableTags={tags}
        defaultSelectedTagIds={mystery.tags.map((entry) => entry.tagId)}
      />
    </div>
  );
}
