import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getEnabledModuleKeys } from "@/modules/core/campaigns/module-settings";
import { listAttributes, listRollFormulas, formulaNamesReferencingKey } from "@/modules/gametools/system/queries";
import { SystemTabs } from "@/components/campaigns/system-tabs";
import { AttributeList } from "@/components/system/attribute-list";

export const metadata: Metadata = { title: "Atributos" };

interface AttributesPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function AttributesPage({ params }: AttributesPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  let membership;
  try {
    membership = await requireCampaignAccess(user.id, campaignId);
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const enabledModuleKeys = await getEnabledModuleKeys(campaignId);
  if (!enabledModuleKeys.has("system")) notFound();

  const canManage = membership.role !== "PLAYER";
  const [attributes, formulas] = await Promise.all([
    listAttributes(user.id, campaignId),
    listRollFormulas(user.id, campaignId),
  ]);

  const referencingFormulasByKey = Object.fromEntries(
    attributes.map((attribute) => [attribute.key, formulaNamesReferencingKey(formulas, attribute.key)]),
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="text-xl font-semibold">Construtor de Sistema</h1>
        <p className="text-sm text-muted-foreground">
          Atributos, recursos, perícias, condições e fórmulas de rolagem do sistema de jogo desta campanha.
        </p>
      </div>

      <SystemTabs campaignId={campaignId} />

      <div>
        <h2 className="text-lg font-semibold">Atributos</h2>
        <p className="text-sm text-muted-foreground">
          Características básicas do sistema (ex.: Força, Destreza). A chave entre chaves (ex.: <code className="font-mono">{"{forca}"}</code>) é o token que as fórmulas de rolagem referenciam.
        </p>
      </div>

      <AttributeList
        campaignId={campaignId}
        attributes={attributes}
        referencingFormulasByKey={referencingFormulasByKey}
        canManage={canManage}
      />
    </div>
  );
}
