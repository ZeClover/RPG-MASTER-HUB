import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { findContradictoryRelationships, findDuplicateOrSimilarNames } from "@/modules/copilot/lore-guardian/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DuplicateNamesList } from "@/components/copilot/duplicate-names-list";
import { ContradictionList } from "@/components/copilot/contradiction-list";

export const metadata: Metadata = { title: "Lore Guardian" };

interface LoreGuardianPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function LoreGuardianPage({ params }: LoreGuardianPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId);
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const [duplicates, contradictions] = await Promise.all([
    findDuplicateOrSimilarNames(campaignId),
    findContradictoryRelationships(campaignId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">Lore Guardian</h1>
          <p className="text-sm text-muted-foreground">
            Verificador heurístico de consistência narrativa — comparação de texto e palavras-chave, sem
            entender o significado de nada. Sempre sugestão para revisar, nunca uma correção automática.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nomes duplicados ou parecidos</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DuplicateNamesList
            rows={duplicates}
            emptyMessage="Nenhum nome idêntico ou parecido encontrado entre as entidades da campanha."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relacionamentos potencialmente contraditórios</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ContradictionList
            rows={contradictions}
            emptyMessage="Nenhum par de relacionamentos com palavras-chave opostas entre as mesmas duas entidades."
          />
        </CardContent>
      </Card>
    </div>
  );
}
