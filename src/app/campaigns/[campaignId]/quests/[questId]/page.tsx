import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Scroll } from "lucide-react";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess } from "@/modules/core/permissions";
import { getQuestForUser } from "@/modules/preparation/quests/queries";
import {
  deleteQuestAction,
  toggleQuestArchivedAction,
  toggleQuestFavoriteAction,
} from "@/modules/preparation/quests/actions";
import { listRelationshipsForEntity } from "@/modules/creation/relationships/queries";
import { Badge } from "@/components/ui/badge";
import { QUEST_STATUS_LABELS, QUEST_STATUS_BADGE_VARIANT } from "@/components/wiki/status-config";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";
import { TagBadgeList } from "@/components/wiki/tag-badge-list";
import { RelatedEntitiesPanel } from "@/components/wiki/related-entities-panel";
import { EntityActionsMenu } from "@/components/wiki/entity-actions-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuestDetailPageProps {
  params: Promise<{ campaignId: string; questId: string }>;
}

export async function generateMetadata({ params }: QuestDetailPageProps): Promise<Metadata> {
  const { campaignId, questId } = await params;
  const user = await requireUser();
  const quest = await getQuestForUser(user.id, campaignId, questId).catch(() => null);
  return { title: quest?.title ?? "Missão" };
}

export default async function QuestDetailPage({ params }: QuestDetailPageProps) {
  const { campaignId, questId } = await params;
  const user = await requireUser();
  const quest = await getQuestForUser(user.id, campaignId, questId);
  if (!quest) notFound();
  const { role } = await requireCampaignAccess(user.id, campaignId);
  const canManage = role !== "PLAYER";

  const relationships = await listRelationshipsForEntity(campaignId, "QUEST", questId, role);

  const fields: { label: string; value: string | null }[] = [
    { label: "Objetivo", value: quest.objective },
    { label: "Descrição", value: quest.description },
    { label: "Recompensa", value: quest.reward },
  ];
  const filledFields = fields.filter((field) => field.value);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-elevated text-xl font-semibold">
            <Scroll className="size-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{quest.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant={QUEST_STATUS_BADGE_VARIANT[quest.status]}>{QUEST_STATUS_LABELS[quest.status]}</Badge>
              <VisibilityBadge visibility={quest.visibility} />
            </div>
          </div>
        </div>

        {canManage && (
          <EntityActionsMenu
            editHref={`/campaigns/${campaignId}/quests/${questId}/edit`}
            favorite={quest.favorite}
            archived={quest.archived}
            onToggleFavorite={toggleQuestFavoriteAction.bind(null, campaignId, questId)}
            onToggleArchived={toggleQuestArchivedAction.bind(null, campaignId, questId)}
            onDelete={deleteQuestAction.bind(null, campaignId, questId)}
            deleteTitle={`Excluir "${quest.title}"?`}
            deleteDescription="Esta ação não pode ser desfeita. Relações com esta missão também serão removidas."
          />
        )}
      </div>

      {quest.tags.length > 0 && (
        <TagBadgeList
          tags={quest.tags.map((entry) => entry.tag)}
          campaignId={campaignId}
          linkBasePath={`/campaigns/${campaignId}/quests`}
        />
      )}

      <div className="flex flex-col gap-4">
        {filledFields.length > 0 ? (
          filledFields.map((field) => (
            <Card key={field.label}>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{field.label}</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap pt-0 text-sm">{field.value}</CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum detalhe preenchido ainda.</p>
        )}
      </div>

      <RelatedEntitiesPanel
        campaignId={campaignId}
        entityType="QUEST"
        entityId={questId}
        relationships={relationships}
      canManage={canManage}
      />
    </div>
  );
}
