import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { searchCampaign } from "@/modules/core/search/queries";
import { SEARCH_RESULT_ICONS, SEARCH_RESULT_LABELS } from "@/modules/core/search/config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Busca" };

interface SearchPageProps {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { campaignId } = await params;
  const { q } = await searchParams;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId);
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const query = q?.trim() ?? "";
  const results = query ? await searchCampaign(user.id, campaignId, query, 30) : [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="text-xl font-semibold">Busca</h1>
        <p className="text-sm text-muted-foreground">
          Procure em NPCs, locais, personagens, sessões e outros conteúdos ativos na campanha.
        </p>
      </div>

      <form action={`/campaigns/${campaignId}/search`} className="flex gap-2">
        <Input name="q" defaultValue={query} placeholder="Buscar…" autoFocus className="flex-1" />
        <Button type="submit">Buscar</Button>
      </form>

      {query && results.length === 0 && (
        <p className="text-sm text-muted-foreground">Nada encontrado para &ldquo;{query}&rdquo;.</p>
      )}

      <div className="flex flex-col gap-2">
        {results.map((result) => {
          const Icon = SEARCH_RESULT_ICONS[result.type];
          return (
            <Link
              key={`${result.type}-${result.id}`}
              href={result.href}
              className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm hover:bg-surface-elevated"
            >
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{result.title}</p>
                {result.subtitle && <p className="truncate text-xs text-muted-foreground">{result.subtitle}</p>}
              </div>
              <Badge variant="outline">{SEARCH_RESULT_LABELS[result.type]}</Badge>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
