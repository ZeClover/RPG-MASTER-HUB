import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { requireUser } from "@/modules/core/auth/session";
import { listActiveCampaignsForUser, listArchivedCampaignsForUser } from "@/modules/core/campaigns/queries";
import { HomeTopbar } from "@/components/layout/home-topbar";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { ImportCampaignDialog } from "@/components/campaigns/import-campaign-dialog";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Minhas campanhas" };

export default async function HomePage() {
  const user = await requireUser();
  const [activeCampaigns, archivedCampaigns] = await Promise.all([
    listActiveCampaignsForUser(user.id),
    listArchivedCampaignsForUser(user.id),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <HomeTopbar user={user} />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Minhas campanhas</h1>
            <p className="text-sm text-muted-foreground">Escolha uma campanha para continuar ou comece uma nova.</p>
          </div>
          <div className="flex items-center gap-2">
            <ImportCampaignDialog />
            <Button asChild>
              <Link href="/campaigns/new">
                <Plus className="size-4" /> Nova campanha
              </Link>
            </Button>
          </div>
        </div>

        {activeCampaigns.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma campanha criada ainda.</p>
            <Button asChild>
              <Link href="/campaigns/new">
                <Plus className="size-4" /> Criar primeira campanha
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}

        {archivedCampaigns.length > 0 && (
          <details className="rounded-xl border border-border p-4">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
              Campanhas arquivadas ({archivedCampaigns.length})
            </summary>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {archivedCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
