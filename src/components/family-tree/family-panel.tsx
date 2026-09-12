"use client";

import { useTransition } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import type { FamilyGroupEntry, FamilyGroups } from "@/modules/worldbuilding/family-tree/tree";
import { deleteFamilyRelationAction } from "@/modules/worldbuilding/family-tree/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddFamilyRelationDialog } from "@/components/family-tree/add-family-relation-dialog";

function DeleteFamilyRelationButton({ campaignId, relationId }: { campaignId: string; relationId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => deleteFamilyRelationAction(campaignId, relationId))}
      className="shrink-0 rounded p-1 text-muted-foreground opacity-60 transition-opacity hover:bg-surface-elevated hover:opacity-100"
      aria-label="Remover parentesco"
    >
      <X className="size-3.5" />
    </button>
  );
}

function FamilyGroupSection({
  label,
  entries,
  campaignId,
}: {
  label: string;
  entries: FamilyGroupEntry[];
  campaignId: string;
}) {
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h4>
      <ul className="flex flex-col gap-1.5">
        {entries.map((entry) => (
          <li
            key={entry.relationId}
            className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
          >
            <Link href={`/campaigns/${campaignId}/npcs/${entry.npc.id}`} className="min-w-0 flex-1 truncate hover:underline">
              {entry.npc.name}
            </Link>
            <DeleteFamilyRelationButton campaignId={campaignId} relationId={entry.relationId} />
          </li>
        ))}
      </ul>
    </div>
  );
}

interface FamilyPanelProps {
  campaignId: string;
  npcId: string;
  npcName: string;
  groups: FamilyGroups;
}

export function FamilyPanel({ campaignId, npcId, npcName, groups }: FamilyPanelProps) {
  const isEmpty =
    groups.parents.length === 0 &&
    groups.children.length === 0 &&
    groups.spouses.length === 0 &&
    groups.siblings.length === 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Família</CardTitle>
        <AddFamilyRelationDialog campaignId={campaignId} npcId={npcId} npcName={npcName} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        {isEmpty ? (
          <p className="text-sm text-muted-foreground">Nenhum parentesco registrado ainda.</p>
        ) : (
          <>
            <FamilyGroupSection label="Pais" entries={groups.parents} campaignId={campaignId} />
            <FamilyGroupSection label="Filhos" entries={groups.children} campaignId={campaignId} />
            <FamilyGroupSection label="Cônjuge(s)" entries={groups.spouses} campaignId={campaignId} />
            <FamilyGroupSection label="Irmãos" entries={groups.siblings} campaignId={campaignId} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
