import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listTimelineEvents } from "@/modules/worldbuilding/timeline/queries";
import { getCampaignCalendar } from "@/modules/worldbuilding/calendar/queries";
import { listTagsForCampaign } from "@/modules/creation/tags/queries";
import { Button } from "@/components/ui/button";
import { WikiListToolbar } from "@/components/wiki/wiki-list-toolbar";
import { EmptyState } from "@/components/wiki/empty-state";
import { TimelineList } from "@/components/timeline/timeline-list";
import { CampaignCalendarWidget } from "@/components/timeline/campaign-calendar-widget";

export const metadata: Metadata = { title: "Linha do Tempo" };

interface TimelinePageProps {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TimelinePage({ params, searchParams }: TimelinePageProps) {
  const { campaignId } = await params;
  const sp = await searchParams;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId);
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const q = typeof sp.q === "string" ? sp.q : undefined;
  const tag = typeof sp.tag === "string" ? sp.tag : undefined;
  const favorite = sp.favorite === "1";
  const archived = sp.archived === "1";

  const [events, tags, calendar] = await Promise.all([
    listTimelineEvents(campaignId, { q, tag, favorite, archived }),
    listTagsForCampaign(campaignId),
    getCampaignCalendar(user.id, campaignId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Linha do Tempo</h1>
          <p className="text-sm text-muted-foreground">Eventos históricos e narrativos da campanha, em ordem.</p>
        </div>
        <Button asChild>
          <Link href={`/campaigns/${campaignId}/timeline/new`}>
            <Plus className="size-4" /> Novo evento
          </Link>
        </Button>
      </div>

      <CampaignCalendarWidget
        campaignId={campaignId}
        currentDay={calendar?.currentDay ?? 1}
        dayLabel={calendar?.dayLabel ?? "Dia"}
      />

      <WikiListToolbar tags={tags} statusOptions={[]} searchPlaceholder="Buscar eventos…" />

      {events.length === 0 ? (
        <EmptyState
          message="Nenhum evento registrado ainda."
          action={
            <Button asChild>
              <Link href={`/campaigns/${campaignId}/timeline/new`}>
                <Plus className="size-4" /> Criar primeiro evento
              </Link>
            </Button>
          }
        />
      ) : (
        <TimelineList campaignId={campaignId} events={events} />
      )}
    </div>
  );
}
