import type { Metadata } from "next";

import { requireUser } from "@/modules/core/auth/session";
import { createCampaignAction } from "@/modules/core/campaigns/actions";
import { HomeTopbar } from "@/components/layout/home-topbar";
import { CampaignForm } from "@/components/campaigns/campaign-form";

export const metadata: Metadata = { title: "Nova campanha" };

export default async function NewCampaignPage() {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <HomeTopbar user={user} />

      <div className="mx-auto w-full max-w-2xl flex-1 p-4 sm:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Nova campanha</h1>
          <p className="text-sm text-muted-foreground">
            Dê um nome e uma identidade visual à sua campanha. Você pode ajustar tudo depois.
          </p>
        </div>

        <CampaignForm action={createCampaignAction} submitLabel="Criar campanha" />
      </div>
    </div>
  );
}
