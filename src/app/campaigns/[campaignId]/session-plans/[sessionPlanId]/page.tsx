import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarCheck } from "lucide-react";

import { requireUser } from "@/modules/core/auth/session";
import { getSessionPlanForUser } from "@/modules/preparation/session-plans/queries";
import {
  deleteSessionPlanAction,
  toggleSessionPlanArchivedAction,
  toggleSessionPlanFavoriteAction,
} from "@/modules/preparation/session-plans/actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityActionsMenu } from "@/components/wiki/entity-actions-menu";
import { SESSION_PLAN_STATUS_BADGE_VARIANT, SESSION_PLAN_STATUS_LABELS } from "@/components/wiki/status-config";
import { SceneList } from "@/components/session-plans/scene-list";
import { SessionChecklist } from "@/components/session-plans/session-checklist";

interface SessionPlanDetailPageProps {
  params: Promise<{ campaignId: string; sessionPlanId: string }>;
}

export async function generateMetadata({ params }: SessionPlanDetailPageProps): Promise<Metadata> {
  const { campaignId, sessionPlanId } = await params;
  const user = await requireUser();
  const sessionPlan = await getSessionPlanForUser(user.id, campaignId, sessionPlanId).catch(() => null);
  return { title: sessionPlan?.title ?? "Sessão" };
}

export default async function SessionPlanDetailPage({ params }: SessionPlanDetailPageProps) {
  const { campaignId, sessionPlanId } = await params;
  const user = await requireUser();
  const sessionPlan = await getSessionPlanForUser(user.id, campaignId, sessionPlanId);
  if (!sessionPlan) notFound();

  const doneCount = sessionPlan.checklist.filter((item) => item.done).length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-elevated">
            <CalendarCheck className="size-6 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">
              {sessionPlan.sessionNumber ? `Sessão ${sessionPlan.sessionNumber} — ` : ""}
              {sessionPlan.title}
            </h1>
            {sessionPlan.plannedDate && (
              <p className="text-sm text-muted-foreground">
                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(sessionPlan.plannedDate)}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant={SESSION_PLAN_STATUS_BADGE_VARIANT[sessionPlan.status]}>
                {SESSION_PLAN_STATUS_LABELS[sessionPlan.status]}
              </Badge>
            </div>
          </div>
        </div>

        <EntityActionsMenu
          editHref={`/campaigns/${campaignId}/session-plans/${sessionPlanId}/edit`}
          favorite={sessionPlan.favorite}
          archived={sessionPlan.archived}
          onToggleFavorite={toggleSessionPlanFavoriteAction.bind(null, campaignId, sessionPlanId)}
          onToggleArchived={toggleSessionPlanArchivedAction.bind(null, campaignId, sessionPlanId)}
          onDelete={deleteSessionPlanAction.bind(null, campaignId, sessionPlanId)}
          deleteTitle={`Excluir "${sessionPlan.title}"?`}
          deleteDescription="Esta ação não pode ser desfeita. Todas as cenas e itens de checklist desta sessão também serão excluídos."
        />
      </div>

      {sessionPlan.pitch && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Do que se trata</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap pt-0 text-sm">{sessionPlan.pitch}</CardContent>
        </Card>
      )}

      {sessionPlan.gmNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Notas do mestre</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap pt-0 text-sm">{sessionPlan.gmNotes}</CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Cenas ({sessionPlan.scenes.length})</h2>
        <SceneList scenes={sessionPlan.scenes} campaignId={campaignId} sessionPlanId={sessionPlanId} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">
          Checklist {sessionPlan.checklist.length > 0 && `(${doneCount}/${sessionPlan.checklist.length})`}
        </h2>
        <SessionChecklist items={sessionPlan.checklist} campaignId={campaignId} sessionPlanId={sessionPlanId} />
      </div>
    </div>
  );
}
