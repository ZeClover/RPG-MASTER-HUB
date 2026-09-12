import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { getNpcForUser } from "@/modules/creation/npcs/queries";
import { deleteNpcAction, toggleNpcArchivedAction, toggleNpcFavoriteAction } from "@/modules/creation/npcs/actions";
import { listRelationshipsForEntity } from "@/modules/creation/relationships/queries";
import { listFamilyRelationsForNpc } from "@/modules/worldbuilding/family-tree/queries";
import { groupFamilyRelationsForNpc } from "@/modules/worldbuilding/family-tree/tree";
import { CanonStatusBadge } from "@/components/wiki/canon-status-badge";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";
import { TagBadgeList } from "@/components/wiki/tag-badge-list";
import { RelatedEntitiesPanel } from "@/components/wiki/related-entities-panel";
import { EntityActionsMenu } from "@/components/wiki/entity-actions-menu";
import { FamilyPanel } from "@/components/family-tree/family-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NpcDetailPageProps {
  params: Promise<{ campaignId: string; npcId: string }>;
}

export async function generateMetadata({ params }: NpcDetailPageProps): Promise<Metadata> {
  const { campaignId, npcId } = await params;
  const user = await requireUser();
  const npc = await getNpcForUser(user.id, campaignId, npcId).catch(() => null);
  return { title: npc?.name ?? "NPC" };
}

export default async function NpcDetailPage({ params }: NpcDetailPageProps) {
  const { campaignId, npcId } = await params;
  const user = await requireUser();
  const npc = await getNpcForUser(user.id, campaignId, npcId);
  if (!npc) notFound();

  const relationships = await listRelationshipsForEntity(campaignId, "NPC", npcId);
  const familyRelations = await listFamilyRelationsForNpc(campaignId, npcId);
  const familyGroups = groupFamilyRelationsForNpc(npcId, familyRelations);

  const fields: { label: string; value: string | null }[] = [
    { label: "Aparência", value: npc.appearance },
    { label: "Personalidade", value: npc.personality },
    { label: "História", value: npc.history },
    { label: "Objetivos", value: npc.goals },
    { label: "Medos", value: npc.fears },
    { label: "Segredos", value: npc.secrets },
    { label: "Notas do Mestre", value: npc.gmNotes },
  ];
  const filledFields = fields.filter((field) => field.value);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-elevated text-xl font-semibold">
            {npc.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL dinâmica de storage
              <img src={npc.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              npc.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{npc.name}</h1>
            <p className="text-sm text-muted-foreground">
              {[npc.species, npc.age, npc.gender, npc.narrativeStatus].filter(Boolean).join(" · ") ||
                "Sem detalhes básicos ainda."}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <CanonStatusBadge status={npc.canonStatus} />
              <VisibilityBadge visibility={npc.visibility} />
            </div>
          </div>
        </div>

        <EntityActionsMenu
          editHref={`/campaigns/${campaignId}/npcs/${npcId}/edit`}
          favorite={npc.favorite}
          archived={npc.archived}
          onToggleFavorite={toggleNpcFavoriteAction.bind(null, campaignId, npcId)}
          onToggleArchived={toggleNpcArchivedAction.bind(null, campaignId, npcId)}
          onDelete={deleteNpcAction.bind(null, campaignId, npcId)}
          deleteTitle={`Excluir "${npc.name}"?`}
          deleteDescription="Esta ação não pode ser desfeita. Relações com este NPC também serão removidas."
        />
      </div>

      {npc.tags.length > 0 && (
        <TagBadgeList
          tags={npc.tags.map((entry) => entry.tag)}
          campaignId={campaignId}
          linkBasePath={`/campaigns/${campaignId}/npcs`}
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

      <FamilyPanel campaignId={campaignId} npcId={npcId} npcName={npc.name} groups={familyGroups} />

      <RelatedEntitiesPanel campaignId={campaignId} entityType="NPC" entityId={npcId} relationships={relationships} />
    </div>
  );
}
