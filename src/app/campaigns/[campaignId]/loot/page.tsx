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

export const metadata: Metadata = { title: "Loot Generator" };

interface LootPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function LootPage({ params }: LootPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId);
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const tables = await listRollTables(campaignId, "LOOT");
  const basePath = `/campaigns/${campaignId}/loot`;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Loot Generator</h1>
          <p className="text-sm text-muted-foreground">
            Tabelas de loot com itens ponderados — a mesma tabela do Table Builder, só que pensada para sortear
            recompensas: dê um nome ao item e um peso/chance, e &ldquo;Rolar&rdquo; sorteia quantos você quiser de
            uma vez.
          </p>
        </div>
        <Button asChild>
          <Link href={`${basePath}/new`}>
            <Plus className="size-4" /> Nova tabela de loot
          </Link>
        </Button>
      </div>

      {tables.length === 0 ? (
        <EmptyState
          message="Nenhuma tabela de loot criada ainda."
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
            <RollTableCard key={table.id} campaignId={campaignId} kind="LOOT" basePath={basePath} table={table} />
          ))}
        </div>
      )}
    </div>
  );
}
