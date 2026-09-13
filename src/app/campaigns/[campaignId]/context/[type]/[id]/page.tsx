import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Star } from "lucide-react";

import type { RelatableEntityType } from "@/generated/prisma/client";
import { requireUser } from "@/modules/core/auth/session";
import { CampaignAccessError } from "@/modules/core/permissions";
import { getEntityContext } from "@/modules/intelligence/context-engine/queries";
import { ENTITY_TYPE_LABELS } from "@/modules/creation/relationships/config";
import { CanonStatusBadge } from "@/components/wiki/canon-status-badge";
import { VisibilityBadge } from "@/components/wiki/visibility-badge";
import { TagBadgeList } from "@/components/wiki/tag-badge-list";
import { MarkdownContent } from "@/components/wiki/markdown-content";
import { RelatedEntitiesPanel } from "@/components/wiki/related-entities-panel";
import { FamilyPanel } from "@/components/family-tree/family-panel";
import { LinkingCluesPanel } from "@/components/intelligence/linking-clues-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const VALID_TYPES = new Set(Object.keys(ENTITY_TYPE_LABELS));

interface ContextSubjectPageProps {
  params: Promise<{ campaignId: string; type: string; id: string }>;
}

function parseType(raw: string): RelatableEntityType | null {
  return VALID_TYPES.has(raw) ? (raw as RelatableEntityType) : null;
}

export async function generateMetadata({ params }: ContextSubjectPageProps): Promise<Metadata> {
  const { campaignId, type: rawType, id } = await params;
  const type = parseType(rawType);
  if (!type) return { title: "Context Engine" };
  const user = await requireUser();
  const bundle = await getEntityContext(user.id, campaignId, type, id).catch(() => null);
  return { title: bundle ? `${bundle.subject.name} · Contexto` : "Context Engine" };
}

export default async function ContextSubjectPage({ params }: ContextSubjectPageProps) {
  const { campaignId, type: rawType, id } = await params;
  const type = parseType(rawType);
  if (!type) notFound();

  const user = await requireUser();
  let bundle;
  try {
    bundle = await getEntityContext(user.id, campaignId, type, id);
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }
  if (!bundle) notFound();

  const { subject, relationships, linkingClues, family } = bundle;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-elevated text-lg font-semibold">
            {subject.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL dinâmica de storage
              <img src={subject.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              subject.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline">{ENTITY_TYPE_LABELS[type]}</Badge>
              {subject.favorite && <Star className="size-3.5 fill-accent text-accent" />}
              {subject.archived && <Badge variant="outline">Arquivado</Badge>}
            </div>
            <h1 className="mt-1 text-xl font-semibold">{subject.name}</h1>
            {subject.subtitle && <p className="text-sm text-muted-foreground">{subject.subtitle}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {subject.canonStatus && <CanonStatusBadge status={subject.canonStatus} />}
              {subject.statusLabel && <Badge variant="outline">{subject.statusLabel}</Badge>}
              <VisibilityBadge visibility={subject.visibility} />
            </div>
          </div>
        </div>

        <Link
          href={subject.detailHref}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-elevated"
        >
          Ficha completa <ExternalLink className="size-3.5" />
        </Link>
      </div>

      {subject.tags.length > 0 && <TagBadgeList tags={subject.tags} campaignId={campaignId} />}

      {subject.markdown && (
        <Card>
          <CardContent className="pt-5">
            <MarkdownContent source={subject.markdown} />
          </CardContent>
        </Card>
      )}

      {subject.fields.length > 0 && (
        <div className="flex flex-col gap-4">
          {subject.fields.map((field) => (
            <Card key={field.label}>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{field.label}</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap pt-0 text-sm">{field.value}</CardContent>
            </Card>
          ))}
        </div>
      )}

      {subject.monsterAttributes && subject.monsterAttributes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Atributos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-0">
            {subject.monsterAttributes.map((attr, index) => (
              <Badge key={`${attr.key}-${index}`} variant="secondary">
                {attr.key}: {attr.value}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {subject.mysteryClues && subject.mysteryClues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pistas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5 pt-0 text-sm">
            {subject.mysteryClues.map((clue) => (
              <p key={clue.id} className={clue.discovered ? "" : "text-muted-foreground"}>
                {clue.discovered ? "✓" : "○"} {clue.text}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {family && <FamilyPanel campaignId={campaignId} npcId={id} npcName={subject.name} groups={family} />}

      <LinkingCluesPanel clues={linkingClues} />

      <RelatedEntitiesPanel campaignId={campaignId} entityType={type} entityId={id} relationships={relationships} />
    </div>
  );
}
