import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  Brain,
  Dices,
  Lightbulb,
  MapPin,
  ScrollText,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

import { requireUser } from "@/modules/core/auth/session";
import { getCampaignForUser, countCampaignMembers } from "@/modules/core/campaigns/queries";
import { CampaignAccessError } from "@/modules/core/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatRelativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

const QUICK_ACTIONS = [
  { label: "Criar NPC", icon: Users, phase: "Fase 1" },
  { label: "Criar Local", icon: MapPin, phase: "Fase 1" },
  { label: "Brainstorm", icon: Lightbulb, phase: "Fase 1" },
  { label: "Criar Missão", icon: ScrollText, phase: "Fase 2" },
  { label: "Criar Cena", icon: Sparkles, phase: "Fase 2" },
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

  const memberCount = await countCampaignMembers(campaignId);

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

      <Card>
        <CardHeader>
          <CardTitle>Ações rápidas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 pt-0 sm:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
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
          <Button asChild variant="outline" className="col-span-2 h-auto flex-col gap-2 py-3 sm:col-span-1">
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
