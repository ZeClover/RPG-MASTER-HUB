import Link from "next/link";
import { Heart, Users } from "lucide-react";

import type { FamilyTreeNode } from "@/modules/worldbuilding/family-tree/tree";

function NodeCard({ campaignId, node }: { campaignId: string; node: FamilyTreeNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/campaigns/${campaignId}/npcs/${node.npc.id}`}
          className="rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-sm font-medium hover:border-primary/50"
        >
          {node.npc.name}
        </Link>
        {node.spouses.map((spouse) => (
          <span key={spouse.id} className="flex items-center gap-1 text-xs text-muted-foreground">
            <Heart className="size-3 shrink-0" /> casado(a) com{" "}
            <Link href={`/campaigns/${campaignId}/npcs/${spouse.id}`} className="hover:underline">
              {spouse.name}
            </Link>
          </span>
        ))}
        {node.siblings.map((sibling) => (
          <span key={sibling.id} className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="size-3 shrink-0" /> irmão/irmã de{" "}
            <Link href={`/campaigns/${campaignId}/npcs/${sibling.id}`} className="hover:underline">
              {sibling.name}
            </Link>
          </span>
        ))}
      </div>

      {node.children.length > 0 && (
        <ul className="flex flex-col gap-3 border-l border-border pl-4">
          {node.children.map((child) => (
            <li key={child.npc.id}>
              <NodeCard campaignId={campaignId} node={child} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function FamilyTreeView({ campaignId, roots }: { campaignId: string; roots: FamilyTreeNode[] }) {
  return (
    <div className="flex flex-col gap-6">
      {roots.map((root) => (
        <NodeCard key={root.npc.id} campaignId={campaignId} node={root} />
      ))}
    </div>
  );
}
