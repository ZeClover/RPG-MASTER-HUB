"use client";

import { useTransition } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import type { RelatableEntityType } from "@/generated/prisma/client";
import { deleteRelationshipAction } from "@/modules/creation/relationships/actions";
import type { ResolvedRelationship } from "@/modules/creation/relationships/queries";
import { ENTITY_TYPE_ICONS, ENTITY_TYPE_LABELS_PLURAL, getEntityHref } from "@/modules/creation/relationships/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddRelationshipDialog } from "@/components/wiki/add-relationship-dialog";

function DeleteRelationshipButton({ relationshipId, campaignId }: { relationshipId: string; campaignId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => deleteRelationshipAction(relationshipId, campaignId))}
      className="shrink-0 rounded p-1 text-muted-foreground opacity-60 transition-opacity hover:bg-surface-elevated hover:opacity-100"
      aria-label="Remover relação"
    >
      <X className="size-3.5" />
    </button>
  );
}

interface RelatedEntitiesPanelProps {
  campaignId: string;
  entityType: RelatableEntityType;
  entityId: string;
  relationships: ResolvedRelationship[];
}

export function RelatedEntitiesPanel({ campaignId, entityType, entityId, relationships }: RelatedEntitiesPanelProps) {
  const grouped = new Map<RelatableEntityType, ResolvedRelationship[]>();
  for (const rel of relationships) {
    if (!grouped.has(rel.other.type)) grouped.set(rel.other.type, []);
    grouped.get(rel.other.type)!.push(rel);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Relacionamentos</CardTitle>
        <AddRelationshipDialog campaignId={campaignId} sourceType={entityType} sourceId={entityId} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        {relationships.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma relação registrada ainda.</p>
        ) : (
          [...grouped.entries()].map(([type, rels]) => {
            const Icon = ENTITY_TYPE_ICONS[type];
            return (
              <div key={type} className="flex flex-col gap-2">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Icon className="size-3.5" /> {ENTITY_TYPE_LABELS_PLURAL[type]} relacionados
                </h4>
                <ul className="flex flex-col gap-1.5">
                  {rels.map((rel) => (
                    <li
                      key={rel.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <Link
                        href={getEntityHref(campaignId, rel.other.type, rel.other.id)}
                        className="min-w-0 flex-1 truncate hover:underline"
                      >
                        {rel.direction === "outgoing" ? (
                          <>
                            <span className="text-muted-foreground">{rel.type}</span> →{" "}
                            <span className="font-medium">{rel.other.name}</span>
                          </>
                        ) : (
                          <>
                            <span className="font-medium">{rel.other.name}</span> →{" "}
                            <span className="text-muted-foreground">{rel.type}</span>
                          </>
                        )}
                      </Link>
                      <DeleteRelationshipButton relationshipId={rel.id} campaignId={campaignId} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
