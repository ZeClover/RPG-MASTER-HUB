import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  Brain,
  CalendarCheck,
  Dices,
  GitBranch,
  Lightbulb,
  MapPin,
  Scroll,
  Settings,
  Shield,
  ShieldAlert,
  Users,
} from "lucide-react";

import { requireUser } from "@/modules/core/auth/session";
import { getCampaignForUser, countCampaignMembers } from "@/modules/core/campaigns/queries";
import { CampaignAccessError } from "@/modules/core/permissions";
import { countNpcs } from "@/modules/creation/npcs/queries";
import { countLocations } from "@/modules/creation/locations/queries";
import { countFactions } from "@/modules/creation/factions/queries";
import { countLorePages } from "@/modules/creation/lore/queries";
import { countIdeas } from "@/modules/creation/ideas/queries";
import { countSessionPlans } from "@/modules/preparation/session-plans/queries";
import { countQuests } from "@/modules/preparation/quests/queries";
import { countPlotThreads } from "@/modules/preparation/plot-threads/queries";
import { countConsequences } from "@/modules/preparation/consequences/queries";
import { listFavoriteEntities, listRecentEntities } from "@/modules/core/dashboard/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { EntityRefList } from "@/components/wiki/entity-ref-list";
import { formatDateTime, formatRelativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

const COMING_SOON_ACTIONS = [
  { label: "Rolar Dados", icon: Dices, phase: "Fase 3" },
  { label: "Abrir Modo Sessão", icon: BookOpen, phase: "Fase 3" },
];

interface DashboardPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function CampaignDashboardPage({ params }: DashboardPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  let campaign;
  try {
    ({ campaign } = await getCampaignForUser(user.id, campaignId));
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const [
    memberCount,
    npcCount,
    locationCount,
    factionCount,
    loreCount,
    ideaCount,
    sessionPlanCount,
    questCount,
    plotThreadCount,
    consequenceCount,
    recent,
    favorites,
  ] = await Promise.all([
    countCampaignMembers(campaignId),
    countNpcs(campaignId),
    countLocations(campaignId),
    countFactions(campaignId),
    countLorePages(campaignId),
    countIdeas(campaignId),
    countSessionPlans(campaignId),
    countQuests(campaignId),
    countPlotThreads(campaignId),
    countConsequences(campaignId),
    listRecentEntities(campaignId, 6),
    listFavoriteEntities(campaignId, 6),
  ]);

  const contentCounts = [
    { label: "NPCs", count: npcCount, href: `/campaigns/${campaignId}/npcs`, icon: Users },
    { label: "Locais", count: locationCount, href: `/campaigns/${campaignId}/locations`, icon: MapPin },
    { label: "Facções", count: factionCount, href: `/campaigns/${campaignId}/factions`, icon: Shield },
    { label: "Lore", count: loreCount, href: `/campaigns/${campaignId}/lore`, icon: BookOpen },
    { label: "Ideias", count: ideaCount, href: `/campaigns/${campaignId}/ideas`, icon: Lightbulb },
    { label: "Sessões", count: sessionPlanCount, href: `/campaigns/${campaignId}/session-plans`, icon: CalendarCheck },
    { label: "Missões", count: questCount, href: `/campaigns/${campaignId}/quests`, icon: Scroll },
    { label: "Tramas", count: plotThreadCount, href: `/campaigns/${campaignId}/plot-threads`, icon: GitBranch },
    {
      label: "Consequências",
      count: consequenceCount,
      href: `/campaigns/${campaignId}/consequences`,
      icon: ShieldAlert,
    },
  ];

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {contentCounts.map((item) => (
          <Link key={item.label} href={item.href}>
            <Card className="p-4 transition-colors hover:border-primary/50">
              <item.icon className="mb-2 size-4 text-muted-foreground" />
              <p className="text-lg font-semibold">{item.count}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
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
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-3">
            <Link href={`/campaigns/${campaignId}/npcs/new`}>
              <Users className="size-4" /> Criar NPC
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-3">
            <Link href={`/campaigns/${campaignId}/locations/new`}>
              <MapPin className="size-4" /> Criar Local
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-3">
            <Link href={`/campaigns/${campaignId}/factions/new`}>
              <Shield className="size-4" /> Criar Facção
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-3">
            <Link href={`/campaigns/${campaignId}/lore/new`}>
              <BookOpen className="size-4" /> Criar Lore
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-3">
            <Link href={`/campaigns/${campaignId}/ideas`}>
              <Lightbulb className="size-4" /> Nova Ideia
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-3">
            <Link href={`/campaigns/${campaignId}/session-plans/new`}>
              <CalendarCheck className="size-4" /> Nova Sessão
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-3">
            <Link href={`/campaigns/${campaignId}/quests/new`}>
              <Scroll className="size-4" /> Criar Missão
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-3">
            <Link href={`/campaigns/${campaignId}/plot-threads/new`}>
              <GitBranch className="size-4" /> Criar Trama
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-3">
            <Link href={`/campaigns/${campaignId}/consequences/new`}>
              <ShieldAlert className="size-4" /> Criar Consequência
            </Link>
          </Button>
          {COMING_SOON_ACTIONS.map((action) => (
            <Tooltip key={action.label}>
              <TooltipTrigger
                aria-disabled="true"
                className="flex cursor-not-allowed flex-col items-center gap-2 rounded-lg border border-border p-3 text-xs text-muted-foreground/50"
              >
                <action.icon className="size-4" />
                {action.label}
              </TooltipTrigger>
              <TooltipContent>Em breve — chega na {action.phase}</TooltipContent>
            </Tooltip>
          ))}
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-3">
            <Link href={`/campaigns/${campaignId}/settings`}>
              <Settings className="size-4" />
              Configurações
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Brain className="size-4 text-primary" />
          <CardTitle>Campaign Brain</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-sm text-muted-foreground">
          Em breve (Fase 7), este painel vai reunir tramas abertas, NPCs esquecidos, consequências pendentes
          e relógios narrativos em um só lugar — usando os dados estruturados da própria campanha.
        </CardContent>
      </Card>
    </div>
  );
}
