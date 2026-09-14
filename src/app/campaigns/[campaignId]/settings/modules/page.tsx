import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getEnabledModuleKeys } from "@/modules/core/campaigns/module-settings";
import { TOGGLEABLE_MODULES } from "@/components/layout/campaign-nav-items";
import { SettingsTabs } from "@/components/campaigns/settings-tabs";
import { ModuleToggleSwitch } from "@/components/campaigns/module-toggle-switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Módulos da campanha" };

interface SettingsModulesPageProps {
  params: Promise<{ campaignId: string }>;
}

const SECTION_ORDER = [
  "Criação",
  "Preparação",
  "Sessão",
  "Mundo",
  "Jogo",
  "Áudio",
  "Ferramentas",
  "Inteligência",
  "Copiloto",
  "Arsenal",
];

function groupBySection(items: typeof TOGGLEABLE_MODULES) {
  const groups = new Map<string, typeof TOGGLEABLE_MODULES>();
  for (const item of items) {
    const section = item.section ?? "Outros";
    const group = groups.get(section) ?? [];
    group.push(item);
    groups.set(section, group);
  }
  return SECTION_ORDER.filter((section) => groups.has(section)).map((section) => ({
    section,
    modules: groups.get(section)!,
  }));
}

export default async function SettingsModulesPage({ params }: SettingsModulesPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "OWNER");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const enabledKeys = await getEnabledModuleKeys(campaignId);
  const groups = groupBySection(TOGGLEABLE_MODULES);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="text-xl font-semibold">Configurações da campanha</h1>
        <p className="text-sm text-muted-foreground">
          Escolha quais módulos aparecem na navegação desta campanha — comece enxuto, ligue o resto quando precisar.
        </p>
      </div>

      <SettingsTabs campaignId={campaignId} />

      {groups.map(({ section, modules: sectionModules }) => (
        <Card key={section}>
          <CardHeader>
            <CardTitle>{section}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-0">
            {sectionModules.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <ModuleToggleSwitch
                  campaignId={campaignId}
                  moduleKey={item.key}
                  enabled={enabledKeys.has(item.key)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
