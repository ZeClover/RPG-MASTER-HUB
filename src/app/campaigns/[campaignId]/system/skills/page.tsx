import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getEnabledModuleKeys } from "@/modules/core/campaigns/module-settings";
import { listAttributes, listRollFormulas, listSkills, formulaNamesReferencingKey } from "@/modules/gametools/system/queries";
import { SystemTabs } from "@/components/campaigns/system-tabs";
import { SkillList } from "@/components/system/skill-list";

export const metadata: Metadata = { title: "Perícias" };

interface SkillsPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function SkillsPage({ params }: SkillsPageProps) {
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
  const [skills, attributes, formulas] = await Promise.all([
    listSkills(user.id, campaignId),
    listAttributes(user.id, campaignId),
    listRollFormulas(user.id, campaignId),
  ]);

  const referencingFormulasByKey = Object.fromEntries(
    skills.map((skill) => [skill.key, formulaNamesReferencingKey(formulas, skill.key)]),
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
        <h2 className="text-lg font-semibold">Perícias</h2>
        <p className="text-sm text-muted-foreground">
          Perícias do sistema (ex.: Atletismo), opcionalmente ligadas a um atributo só para organização — a
          fórmula de rolagem de uma perícia é criada separadamente, na aba Fórmulas.
        </p>
      </div>

      <SkillList
        campaignId={campaignId}
        skills={skills}
        attributes={attributes}
        referencingFormulasByKey={referencingFormulasByKey}
        canManage={canManage}
      />
    </div>
  );
}
