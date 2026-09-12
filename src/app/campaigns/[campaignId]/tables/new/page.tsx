import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { createRollTableAction } from "@/modules/gametools/roll-tables/actions";
import { RollTableForm } from "@/components/roll-tables/roll-table-form";

export const metadata: Metadata = { title: "Nova tabela" };

interface NewTablePageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function NewTablePage({ params }: NewTablePageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const action = createRollTableAction.bind(null, campaignId, "GENERIC");

  return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Nova tabela</h1>
        <p className="text-sm text-muted-foreground">Entradas são adicionadas depois de criar a tabela.</p>
      </div>
      <RollTableForm action={action} submitLabel="Criar tabela" namePlaceholder="Ex.: Encontros na estrada (d20)" />
    </div>
  );
}
