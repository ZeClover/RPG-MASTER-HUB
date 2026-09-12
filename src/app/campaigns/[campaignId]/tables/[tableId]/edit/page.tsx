import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getRollTableForUser } from "@/modules/gametools/roll-tables/queries";
import { updateRollTableAction } from "@/modules/gametools/roll-tables/actions";
import { RollTableForm } from "@/components/roll-tables/roll-table-form";

export const metadata: Metadata = { title: "Editar tabela" };

interface EditTablePageProps {
  params: Promise<{ campaignId: string; tableId: string }>;
}

export default async function EditTablePage({ params }: EditTablePageProps) {
  const { campaignId, tableId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const table = await getRollTableForUser(user.id, campaignId, "GENERIC", tableId);
  if (!table) notFound();

  const action = updateRollTableAction.bind(null, campaignId, "GENERIC", tableId);

  return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Editar {table.name}</h1>
      </div>
      <RollTableForm
        action={action}
        submitLabel="Salvar alterações"
        defaultValues={table}
        namePlaceholder="Ex.: Encontros na estrada (d20)"
      />
    </div>
  );
}
