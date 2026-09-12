import type { ReactNode } from "react";
import Link from "next/link";
import { Star } from "lucide-react";

import { Card } from "@/components/ui/card";

export interface WikiEntitySummary {
  id: string;
  href: string;
  name: string;
  imageUrl: string | null;
  excerpt: string | null;
  /** Badge(s) de status — cada domínio tem seu próprio enum (CanonStatus, QuestStatus, ...),
   * então o card não conhece o tipo concreto: quem monta a lista decide o que renderizar aqui. */
  statusBadges: ReactNode;
  favorite: boolean;
  meta?: string | null;
  tags: { id: string; name: string; color: string | null }[];
}

export function WikiEntityCard({ entity }: { entity: WikiEntitySummary }) {
  return (
    <Card className="relative flex flex-col gap-3 p-4">
      <Link href={entity.href} className="absolute inset-0 z-0" aria-label={`Abrir ${entity.name}`} />

      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-elevated text-sm font-semibold">
          {entity.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL dinâmica de storage
            <img src={entity.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            entity.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold">{entity.name}</h3>
            {entity.favorite && <Star className="size-3.5 shrink-0 fill-accent text-accent" />}
          </div>
          {entity.meta ? <p className="truncate text-xs text-muted-foreground">{entity.meta}</p> : null}
        </div>
      </div>

      {entity.excerpt ? <p className="line-clamp-2 text-xs text-muted-foreground">{entity.excerpt}</p> : null}

      <div className="flex flex-wrap items-center gap-1.5">{entity.statusBadges}</div>
    </Card>
  );
}
