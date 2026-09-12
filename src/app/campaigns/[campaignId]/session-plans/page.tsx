import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, Plus } from "lucide-react";

import type { SessionPlanStatus } from "@/generated/prisma/client";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listSessionPlans } from "@/modules/preparation/session-plans/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { WikiListToolbar } from "@/components/wiki/wiki-list-toolbar";
import { EmptyState } from "@/components/wiki/empty-state";
import { SESSION_PLAN_STATUS_BADGE_VARIANT, SESSION_PLAN_STATUS_LABELS, SESSION_PLAN_STATUS_OPTIONS } from "@/components/wiki/status-config";

export const metadata: Metadata = { title: "Sessões" };

const VALID_STATUSES = new Set(SESSION_PLAN_STATUS_OPTIONS.map(([value]) => value));

interface SessionPlansPageProps {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SessionPlansPage({ params, searchParams }: SessionPlansPageProps) {
  const { campaignId } = await params;
  const sp = await searchParams;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId);
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const q = typeof sp.q === "string" ? sp.q : undefined;
  const status =
    typeof sp.status === "string" && VALID_STATUSES.has(sp.status as SessionPlanStatus)
      ? (sp.status as SessionPlanStatus)
      : undefined;
  const favorite = sp.favorite === "1";
  const archived = sp.archived === "1";

  const sessionPlans = await listSessionPlans(campaignId, { q, status, favorite, archived });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Sessões</h1>
          <p className="text-sm text-muted-foreground">Planejamento de cada sessão: cenas, checklist e notas.</p>
        </div>
        <Button asChild>
          <Link href={`/campaigns/${campaignId}/session-plans/new`}>
            <Plus className="size-4" /> Nova sessão
          </Link>
        </Button>
      </div>

      <WikiListToolbar tags={[]} statusOptions={SESSION_PLAN_STATUS_OPTIONS} searchPlaceholder="Buscar sessões…" />

      {sessionPlans.length === 0 ? (
        <EmptyState
          message="Nenhuma sessão planejada ainda."
          action={
            <Button asChild>
              <Link href={`/campaigns/${campaignId}/session-plans/new`}>
                <Plus className="size-4" /> Planejar primeira sessão
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {sessionPlans.map((plan) => (
            <Link key={plan.id} href={`/campaigns/${campaignId}/session-plans/${plan.id}`}>
              <Card className="flex items-center gap-3 p-4 transition-colors hover:border-primary/50">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-elevated">
                  <CalendarCheck className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">
                    {plan.sessionNumber ? `Sessão ${plan.sessionNumber} — ` : ""}
                    {plan.title}
                  </h3>
                  {plan.pitch && <p className="truncate text-xs text-muted-foreground">{plan.pitch}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {plan._count.scenes} {plan._count.scenes === 1 ? "cena" : "cenas"}
                  </span>
                  <Badge variant={SESSION_PLAN_STATUS_BADGE_VARIANT[plan.status]}>
                    {SESSION_PLAN_STATUS_LABELS[plan.status]}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
