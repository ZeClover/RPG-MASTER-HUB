import type { Metadata } from "next";
import { Radar } from "lucide-react";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { EntityContextPicker } from "@/components/intelligence/entity-context-picker";

export const metadata: Metadata = { title: "Context Engine" };

interface ContextEnginePageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function ContextEnginePage({ params }: ContextEnginePageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center gap-2">
        <Radar className="size-5 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">Context Engine</h1>
          <p className="text-sm text-muted-foreground">
            Escolha uma entidade para ver tudo que já se sabe sobre ela num só lugar — dados próprios,
            relacionamentos, tags e referências cruzadas de outras partes da campanha.
          </p>
        </div>
      </div>

      <EntityContextPicker campaignId={campaignId} />
    </div>
  );
}
