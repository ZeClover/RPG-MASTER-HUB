import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getQuestForUser } from "@/modules/preparation/quests/queries";
import { updateQuestAction } from "@/modules/preparation/quests/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { QuestForm } from "@/components/quests/quest-form";

export const metadata: Metadata = { title: "Editar missão" };

interface EditQuestPageProps {
  params: Promise<{ campaignId: string; questId: string }>;
}

export default async function EditQuestPage({ params }: EditQuestPageProps) {
  const { campaignId, questId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const quest = await getQuestForUser(user.id, campaignId, questId);
  if (!quest) notFound();

  const tags = await listTagsForCampaign(campaignId);
  const action = updateQuestAction.bind(null, campaignId, questId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Editar {quest.title}</h1>
      </div>
      <QuestForm
        campaignId={campaignId}
        action={action}
        submitLabel="Salvar alterações"
        defaultValues={quest}
        availableTags={tags}
        defaultSelectedTagIds={quest.tags.map((entry) => entry.tagId)}
      />
    </div>
  );
}
