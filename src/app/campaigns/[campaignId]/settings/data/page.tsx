import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listCampaignBackupSnapshots } from "@/modules/core/campaigns/export/backups";
import { SettingsTabs } from "@/components/campaigns/settings-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Dados da campanha" };

interface SettingsDataPageProps {
  params: Promise<{ campaignId: string }>;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Configurações → Dados (Fase 12, Part 4 — ver ARCHITECTURE.md). OWNER-only,
 * mesmo gate das outras abas de Configurações. "Baixar backup agora" é
 * literalmente o export do Part 1; a lista abaixo são os snapshots que o cron
 * diário (`/api/cron/backup-campaigns`) já tirou sozinho.
 */
export default async function SettingsDataPage({ params }: SettingsDataPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId, "OWNER");
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const snapshots = await listCampaignBackupSnapshots(campaignId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="text-xl font-semibold">Configurações da campanha</h1>
        <p className="text-sm text-muted-foreground">Exporte, importe e acompanhe os backups desta campanha.</p>
      </div>

      <SettingsTabs campaignId={campaignId} />

      <Card>
        <CardHeader>
          <CardTitle>Backup manual</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          <p className="text-sm text-muted-foreground">
            Baixa um .zip com todos os dados desta campanha (NPCs, Locais, Sessões, Mistérios, etc.) — pode conter
            segredos de mestre, mantenha o arquivo privado. Sirva para restaurar depois (Início → &ldquo;Importar
            campanha&rdquo;, que sempre cria uma campanha nova) ou como cópia de segurança pessoal.
          </p>
          <Button asChild className="w-fit">
            <a href={`/api/v1/campaigns/${campaignId}/export`} download>
              <Download className="size-4" /> Baixar backup agora
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backups automáticos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          <p className="text-sm text-muted-foreground">
            Todo dia, o hub tira um snapshot automático desta campanha (arquivo .json) e guarda os 7 mais recentes.
          </p>
          {snapshots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum backup automático ainda.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {snapshots.map((snapshot) => (
                <li key={snapshot.pathname} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{formatDateTime(snapshot.uploadedAt)}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(snapshot.size)}</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={snapshot.url} download>
                      Baixar
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
