import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listRollTables } from "@/modules/gametools/roll-tables/queries";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/wiki/empty-state";
import { RollTableCard } from "@/components/roll-tables/roll-table-card";

export const metadata: Metadata = { title: "Tabelas" };

interface TablesPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function TablesPage({ params }: TablesPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const tables = await listRollTables(campaignId, "GENERIC");
  const basePath = `/campaigns/${campaignId}/tables`;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Table Builder</h1>
          <p className="text-sm text-muted-foreground">
            Tabelas de rolagem genéricas (d20, d100, ou qualquer faixa customizada) — cada entrada tem um peso, e
            &ldquo;Rolar&rdquo; sorteia uma delas.
          </p>
        </div>
        <Button asChild>
          <Link href={`${basePath}/new`}>
            <Plus className="size-4" /> Nova tabela
          </Link>
        </Button>
      </div>

      {tables.length === 0 ? (
        <EmptyState
          message="Nenhuma tabela criada ainda."
          action={
            <Button asChild>
              <Link href={`${basePath}/new`}>
                <Plus className="size-4" /> Criar primeira tabela
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <RollTableCard key={table.id} campaignId={campaignId} kind="GENERIC" basePath={basePath} table={table} />
          ))}
        </div>
      )}
    </div>
  );
}
