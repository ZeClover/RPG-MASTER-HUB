import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { requireUser } from "@/modules/core/auth/session";
import { getRollTableForUser } from "@/modules/gametools/roll-tables/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RollTableEntryList } from "@/components/roll-tables/roll-table-entry-list";
import { RollTableRoller } from "@/components/roll-tables/roll-table-roller";

interface TableDetailPageProps {
  params: Promise<{ campaignId: string; tableId: string }>;
}

export async function generateMetadata({ params }: TableDetailPageProps): Promise<Metadata> {
  const { campaignId, tableId } = await params;
  const user = await requireUser();
  const table = await getRollTableForUser(user.id, campaignId, "GENERIC", tableId).catch(() => null);
  return { title: table?.name ?? "Tabela" };
}

export default async function TableDetailPage({ params }: TableDetailPageProps) {
  const { campaignId, tableId } = await params;
  const user = await requireUser();
  const table = await getRollTableForUser(user.id, campaignId, "GENERIC", tableId);
  if (!table) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">{table.name}</h1>
          {table.description && <p className="mt-1 text-sm text-muted-foreground">{table.description}</p>}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/campaigns/${campaignId}/tables/${tableId}/edit`}>
            <Pencil className="size-4" /> Editar
          </Link>
        </Button>
      </div>

      <RollTableRoller campaignId={campaignId} tableId={tableId} tableName={table.name} entryCount={table.entries.length} />

      <Card>
        <CardHeader>
          <CardTitle>Entradas</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <RollTableEntryList
            entries={table.entries}
            campaignId={campaignId}
            kind="GENERIC"
            tableId={tableId}
            weightLabel="Peso"
          />
        </CardContent>
      </Card>
    </div>
  );
}
