import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listFamilyRelations } from "@/modules/worldbuilding/family-tree/queries";
import { buildFamilyTrees } from "@/modules/worldbuilding/family-tree/tree";
import { EmptyState } from "@/components/wiki/empty-state";
import { FamilyTreeView } from "@/components/family-tree/family-tree-view";

export const metadata: Metadata = { title: "Family Tree" };

interface FamilyTreePageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function FamilyTreePage({ params }: FamilyTreePageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  let role;
  try {
    ({ role } = await requireCampaignAccess(user.id, campaignId));
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const relations = await listFamilyRelations(campaignId, role);
  const roots = buildFamilyTrees(relations);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="text-xl font-semibold">Family Tree</h1>
        <p className="text-sm text-muted-foreground">
          Parentescos entre NPCs. Adicione ou remova relações a partir da página de cada NPC.
        </p>
      </div>

      {roots.length === 0 ? (
        <EmptyState message="Nenhum parentesco registrado ainda. Abra um NPC e use o painel Família para adicionar." />
      ) : (
        <FamilyTreeView campaignId={campaignId} roots={roots} />
      )}
    </div>
  );
}
