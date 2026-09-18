import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getEnabledModuleKeys } from "@/modules/core/campaigns/module-settings";
import {
  getFormulaTokenSources,
  listRollFormulas,
  unknownTokensByFormula,
} from "@/modules/gametools/system/queries";
import { SystemTabs } from "@/components/campaigns/system-tabs";
import { RollFormulaList } from "@/components/system/roll-formula-list";

export const metadata: Metadata = { title: "Fórmulas de rolagem" };

interface FormulasPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function FormulasPage({ params }: FormulasPageProps) {
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
  const [formulas, { attributes, skills }] = await Promise.all([
    listRollFormulas(user.id, campaignId),
    getFormulaTokenSources(campaignId),
  ]);

  const knownKeys = new Set([...attributes.map((a) => a.key), ...skills.map((s) => s.key)]);
  const unknownByFormula = Object.fromEntries(unknownTokensByFormula(formulas, knownKeys));

  const tokenDefaults: Record<string, number> = {};
  for (const attribute of attributes) tokenDefaults[attribute.key] = attribute.defaultValue;
  for (const skill of skills) tokenDefaults[skill.key] = skill.defaultBonus;

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
        <h2 className="text-lg font-semibold">Fórmulas de rolagem</h2>
        <p className="text-sm text-muted-foreground">
          Uma rolagem de dados + modificadores dos atributos/perícias da campanha (ex.:{" "}
          <code className="font-mono">1d20 + {"{forca}"}</code>). Use o botão &ldquo;Testar&rdquo; para conferir
          o resultado com valores manuais — sem gravar nada na sessão.
        </p>
      </div>

      <RollFormulaList
        campaignId={campaignId}
        formulas={formulas}
        unknownTokensByFormula={unknownByFormula}
        tokenDefaults={tokenDefaults}
        canManage={canManage}
      />
    </div>
  );
}
