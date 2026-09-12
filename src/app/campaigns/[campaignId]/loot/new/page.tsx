import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { createRollTableAction } from "@/modules/gametools/roll-tables/actions";
import { RollTableForm } from "@/components/roll-tables/roll-table-form";

export const metadata: Metadata = { title: "Nova tabela de loot" };

interface NewLootTablePageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function NewLootTablePage({ params }: NewLootTablePageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const action = createRollTableAction.bind(null, campaignId, "LOOT");

  return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Nova tabela de loot</h1>
        <p className="text-sm text-muted-foreground">Itens são adicionados depois de criar a tabela.</p>
      </div>
      <RollTableForm action={action} submitLabel="Criar tabela" namePlaceholder="Ex.: Baú do tesouro do dragão" />
    </div>
  );
}
