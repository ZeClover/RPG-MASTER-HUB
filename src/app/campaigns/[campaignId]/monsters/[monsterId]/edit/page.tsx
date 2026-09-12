import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getMonsterForUser } from "@/modules/gametools/monsters/queries";
import { updateMonsterAction } from "@/modules/gametools/monsters/actions";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { MonsterForm } from "@/components/monsters/monster-form";

export const metadata: Metadata = { title: "Editar monstro" };

interface EditMonsterPageProps {
  params: Promise<{ campaignId: string; monsterId: string }>;
}

export default async function EditMonsterPage({ params }: EditMonsterPageProps) {
  const { campaignId, monsterId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const monster = await getMonsterForUser(user.id, campaignId, monsterId);
  if (!monster) notFound();

  const tags = await listTagsForCampaign(campaignId);
  const action = updateMonsterAction.bind(null, campaignId, monsterId);

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Editar {monster.name}</h1>
      </div>
      <MonsterForm
        campaignId={campaignId}
        action={action}
        submitLabel="Salvar alterações"
        defaultValues={monster}
        availableTags={tags}
        defaultSelectedTagIds={monster.tags.map((entry) => entry.tagId)}
      />
    </div>
  );
}
