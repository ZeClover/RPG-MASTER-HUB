import Link from "next/link";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/wiki/empty-state";

interface CategoryListProps {
  campaignId: string;
  categories: {
    id: string;
    name: string;
    description: string | null;
    _count: { entries: number };
  }[];
  emptyStateAction?: ReactNode;
}

export function CategoryList({ campaignId, categories, emptyStateAction }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <EmptyState
        message="Nenhuma categoria criada ainda. Exemplos: Matéria Escolar, Artes Importantes, Regras da Casa, Facções Secretas, Rituais…"
        action={emptyStateAction}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Card key={category.id} className="relative flex flex-col gap-2 p-4">
          <Link
            href={`/campaigns/${campaignId}/custom-categories/${category.id}`}
            className="absolute inset-0"
            aria-label={`Abrir categoria ${category.name}`}
          />
          <h3 className="truncate text-sm font-semibold">{category.name}</h3>
          {category.description && <p className="line-clamp-2 text-xs text-muted-foreground">{category.description}</p>}
          <Badge variant="outline" className="w-fit">
            {category._count.entries} {category._count.entries === 1 ? "entrada" : "entradas"}
          </Badge>
        </Card>
      ))}
    </div>
  );
}
