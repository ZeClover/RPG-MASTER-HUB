import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Brain, Check, Circle, Dices, Settings, Swords } from "lucide-react";

import { requireUser } from "@/modules/core/auth/session";
import { getCampaignForUser, countCampaignMembers } from "@/modules/core/campaigns/queries";
import { CampaignAccessError } from "@/modules/core/permissions";
import { getEnabledModuleKeys } from "@/modules/core/campaigns/module-settings";
import { DASHBOARD_MODULE_CARDS } from "@/modules/core/dashboard/module-cards";
import { listFavoriteEntities, listRecentEntities } from "@/modules/core/dashboard/queries";
import { roleAtLeast } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EntityRefList } from "@/components/wiki/entity-ref-list";
import { formatDateTime, formatRelativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

interface DashboardPageProps {
  params: Promise<{ campaignId: string }>;
}

interface QuickStartItem {
  key: string;
  label: string;
  subLabel?: string;
  done: boolean;
  href: string;
}

export default async function CampaignDashboardPage({ params }: DashboardPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  let campaign;
  let role;
  try {
    ({ campaign, role } = await getCampaignForUser(user.id, campaignId));
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const [memberCount, enabledModuleKeys, recent, favorites, cardCounts] = await Promise.all([
    countCampaignMembers(campaignId),
    getEnabledModuleKeys(campaignId),
    listRecentEntities(campaignId, 6),
    listFavoriteEntities(campaignId, 6),
    // Conta todo módulo do registro de uma vez, ligado ou não — mais barato que orquestrar duas
    // rodadas de queries, e o checklist de início rápido (Parte 3) precisa de algumas destas
    // contagens (NPCs/Locais/Lore) mesmo fora do conjunto de cards visíveis.
    Promise.all(DASHBOARD_MODULE_CARDS.map((card) => card.count(campaignId))),
  ]);

  const countByModuleKey = new Map(DASHBOARD_MODULE_CARDS.map((card, index) => [card.moduleKey, cardCounts[index]]));

  const visibleCards = DASHBOARD_MODULE_CARDS.filter(
    (card) => enabledModuleKeys.has(card.moduleKey) && roleAtLeast(role, card.minRole ?? "PLAYER"),
  );

  const quickActionCards = visibleCards.flatMap((card) => {
    if (!roleAtLeast(role, card.createMinRole ?? card.minRole ?? "PLAYER")) return [];
    const href = card.newHref(campaignId);
    if (!href) return [];
    return [{ moduleKey: card.moduleKey, icon: card.icon, label: card.createLabel, href }];
  });

  const canRunSession = roleAtLeast(role, "CO_GM");

  // Checklist de início rápido (Parte 3) — sempre computado a partir do que já existe na
  // campanha, nunca guardado num campo/tabela própria: uma campanha "concluída" é só uma
  // campanha onde as contagens abaixo já não são zero, não um estado a manter em sincronia.
  const npcCount = countByModuleKey.get("npcs") ?? 0;
  const locationCount = countByModuleKey.get("locations") ?? 0;
  const loreCount = countByModuleKey.get("lore") ?? 0;
  const characterCount = countByModuleKey.get("characters") ?? 0;
  const sessionPlanCount = countByModuleKey.get("session-plans") ?? 0;

  const checklistItems: QuickStartItem[] = [
    enabledModuleKeys.has("characters") && {
      key: "character",
      label: "Criar seu primeiro Personagem",
      done: characterCount > 0,
      href: `/campaigns/${campaignId}/characters/new`,
    },
    enabledModuleKeys.has("npcs") && {
      key: "npc",
      label: "Criar um NPC importante (ex.: um professor)",
      done: npcCount > 0,
      href: `/campaigns/${campaignId}/npcs/new`,
    },
    enabledModuleKeys.has("locations") && {
      key: "location",
      label: "Criar um Local",
      done: locationCount > 0,
      href: `/campaigns/${campaignId}/locations/new`,
    },
    canRunSession &&
      enabledModuleKeys.has("session-plans") && {
        key: "session-plan",
        label: "Planejar a primeira Sessão",
        done: sessionPlanCount > 0,
        href: `/campaigns/${campaignId}/session-plans/new`,
      },
    enabledModuleKeys.has("lore") && {
      key: "rules",
      label: "Documentar as regras da campanha",
      subLabel: 'crie uma página de Lore chamada "Regras da Casa", por exemplo',
      done: loreCount > 0,
      href: `/campaigns/${campaignId}/lore/new`,
    },
  ].filter((item): item is QuickStartItem => Boolean(item));

  const quickStartDone = checklistItems.every((item) => item.done);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="text-xl font-semibold">{campaign.name}</h1>
        {campaign.description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{campaign.description}</p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            Sem descrição ainda.{" "}
            <Link href={`/campaigns/${campaignId}/settings`} className="text-primary hover:underline">
              Adicionar uma
            </Link>
            .
          </p>
        )}
      </div>

      {canRunSession && (
        <Card>
          <CardHeader>
            <CardTitle>Configuração inicial</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {quickStartDone ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="size-4 shrink-0 text-primary" /> Configuração inicial concluída.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {checklistItems.map((item) => (
                  <li key={item.key}>
                    {item.done ? (
                      <p className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="line-through">{item.label}</span>
                      </p>
                    ) : (
                      <Link
                        href={item.href}
                        className="flex items-start gap-2 text-sm hover:text-primary"
                      >
                        <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <span>
                          {item.label}
                          {item.subLabel && (
                            <span className="block text-xs text-muted-foreground">{item.subLabel}</span>
                          )}
                        </span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {visibleCards.map((card) => (
          <Link key={card.moduleKey} href={card.listHref(campaignId)}>
            <Card className="p-4 transition-colors hover:border-primary/50">
              <card.icon className="mb-2 size-4 text-muted-foreground" />
              <p className="text-lg font-semibold">{countByModuleKey.get(card.moduleKey) ?? 0}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Próxima sessão</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {campaign.nextSessionAt ? (
              <p className="text-sm font-medium">{formatDateTime(campaign.nextSessionAt)}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Não agendada</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Última atualização</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-medium">{formatRelativeTime(campaign.updatedAt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Membros</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-medium">{memberCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimas alterações</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <EntityRefList items={recent} emptyMessage="Nada criado ainda." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Favoritos</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <EntityRefList items={favorites} emptyMessage="Nenhum favorito ainda." />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ações rápidas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 pt-0 sm:grid-cols-4">
          {quickActionCards.map((action) => (
            <Button key={action.moduleKey} asChild variant="outline" className="h-auto flex-col gap-2 py-3">
              <Link href={action.href}>
                <action.icon className="size-4" /> {action.label}
              </Link>
            </Button>
          ))}
          {canRunSession && (
            <>
              <Button asChild variant="outline" className="h-auto flex-col gap-2 py-3">
                <Link href={`/campaigns/${campaignId}/session`}>
                  <Dices className="size-4" /> Rolar Dados
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto flex-col gap-2 py-3">
                <Link href={`/campaigns/${campaignId}/session`}>
                  <Swords className="size-4" /> Abrir Modo Sessão
                </Link>
              </Button>
            </>
          )}
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-3">
            <Link href={`/campaigns/${campaignId}/settings`}>
              <Settings className="size-4" />
              Configurações
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Brain className="size-4 text-primary" />
            <CardTitle>Campaign Brain</CardTitle>
          </div>
          <Link href={`/campaigns/${campaignId}/brain`} className="text-sm text-primary hover:underline">
            Abrir →
          </Link>
        </CardHeader>
        <CardContent className="pt-0 text-sm text-muted-foreground">
          Distribuição canônico/rascunho e o feed completo de tudo que mudou na campanha — todo o
          histórico de edição, incluindo módulos sem card aqui no Dashboard, como Relógios
          Narrativos.
        </CardContent>
      </Card>
    </div>
  );
}
