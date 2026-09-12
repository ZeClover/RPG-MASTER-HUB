import Link from "next/link";
import { Copy, Download, MoreVertical, Settings } from "lucide-react";

import type { Campaign } from "@/generated/prisma/client";
import { ArchiveToggleMenuItem } from "@/components/campaigns/archive-toggle-menu-item";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime, formatRelativeTime } from "@/lib/format";

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const isArchived = campaign.status === "ARCHIVED";
  const accent = campaign.primaryColor ?? "#8b5cf6";

  return (
    <Card className="group relative flex flex-col overflow-hidden">
      <Link
        href={`/campaigns/${campaign.id}/dashboard`}
        className="absolute inset-0 z-0"
        aria-label={`Abrir ${campaign.name}`}
      />

      <div
        className="h-24 w-full overflow-hidden bg-surface-elevated"
        style={!campaign.bannerUrl ? { background: `linear-gradient(135deg, ${accent}40, transparent)` } : undefined}
      >
        {campaign.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL dinâmica de storage
          <img src={campaign.bannerUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-surface-elevated text-sm font-semibold"
              style={{ borderColor: accent }}
            >
              {campaign.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL dinâmica de storage
                <img src={campaign.iconUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                campaign.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold">{campaign.name}</h3>
              <p className="text-xs text-muted-foreground">Atualizado {formatRelativeTime(campaign.updatedAt)}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative z-10 size-8">
                <MoreVertical className="size-4" />
                <span className="sr-only">Ações da campanha</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="relative z-10">
              <DropdownMenuItem asChild>
                <Link href={`/campaigns/${campaign.id}/dashboard`}>Abrir</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/campaigns/${campaign.id}/settings`}>
                  <Settings className="size-4" /> Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <ArchiveToggleMenuItem campaignId={campaign.id} isArchived={isArchived} />
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <Copy className="size-4" /> Duplicar (em breve)
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Download className="size-4" /> Exportar (em breve)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {campaign.description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">{campaign.description}</p>
        ) : null}

        {campaign.nextSessionAt ? (
          <p className="text-xs text-foreground">
            Próxima sessão: <span className="font-medium">{formatDateTime(campaign.nextSessionAt)}</span>
          </p>
        ) : null}
      </div>
    </Card>
  );
}
