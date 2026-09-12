import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listTagsWithUsage } from "@/modules/creation/tags/queries";
import { TagsManager } from "@/components/wiki/tags-manager";

export const metadata: Metadata = { title: "Tags" };

interface TagsPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function TagsPage({ params }: TagsPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId);
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const tags = await listTagsWithUsage(campaignId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="text-xl font-semibold">Tags</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as tags da campanha. Novas tags também podem ser criadas na hora, ao editar qualquer NPC,
          Local, Facção, Lore ou Ideia.
        </p>
      </div>

      <TagsManager tags={tags} campaignId={campaignId} />
    </div>
  );
}
