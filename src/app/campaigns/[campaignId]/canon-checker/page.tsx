import type { Metadata } from "next";
import { Stamp } from "lucide-react";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import {
  findCanonStatusConflicts,
  findActiveContentReferencingOutdated,
} from "@/modules/copilot/canon-checker/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CanonStatusConflictList } from "@/components/copilot/canon-status-conflict-list";
import { ActiveReferencingOutdatedList } from "@/components/copilot/active-referencing-outdated-list";

export const metadata: Metadata = { title: "Canon Checker" };

interface CanonCheckerPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function CanonCheckerPage({ params }: CanonCheckerPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId);
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const [canonConflicts, activeReferencingOutdated] = await Promise.all([
    findCanonStatusConflicts(campaignId),
    findActiveContentReferencingOutdated(campaignId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center gap-2">
        <Stamp className="size-5 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">Canon Checker</h1>
          <p className="text-sm text-muted-foreground">
            Verificador heurístico de status canônico cruzado — compara `canonStatus`/`archived` entre
            entidades relacionadas. Sempre sugestão para revisar, nunca uma correção automática.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Canônico relacionado a algo obsoleto/arquivado</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <CanonStatusConflictList
            rows={canonConflicts}
            emptyMessage="Nenhuma entidade canônica relacionada a algo obsoleto ou arquivado."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Missão/Trama ativa referenciando conteúdo desatualizado</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ActiveReferencingOutdatedList
            rows={activeReferencingOutdated}
            emptyMessage="Nenhuma missão ou trama ativa referenciando conteúdo arquivado ou obsoleto."
          />
        </CardContent>
      </Card>
    </div>
  );
}
