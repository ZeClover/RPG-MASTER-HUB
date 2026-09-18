import { del, list, put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { buildCampaignExport } from "@/modules/core/campaigns/export/export";
import { campaignBackupsPrefix } from "@/modules/core/campaigns/export/backups";

/** Snapshots mantidos por campanha — os mais antigos além deste número são apagados a cada rodada. */
const SNAPSHOTS_TO_KEEP = 7;

/**
 * Cron diário (Fase 12, Part 4 — ver `vercel.json` e ARCHITECTURE.md) que tira
 * um backup JSON (não zip — isto é um snapshot interno, não um download para
 * humanos) de toda campanha `ACTIVE` e sobe pro Vercel Blob.
 *
 * Autenticação: só o Vercel Cron pode chamar isto, via o padrão
 * `Authorization: Bearer ${CRON_SECRET}` que a própria Vercel injeta quando
 * `CRON_SECRET` está configurado como env var. Sem `CRON_SECRET` configurado,
 * a rota recusa rodar (fail closed) — nunca aceita chamadas sem verificação.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET não configurado — recusando rodar sem autenticação." },
      { status: 401 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const campaigns = await db.campaign.findMany({ where: { status: "ACTIVE" }, select: { id: true } });

  const results = await Promise.allSettled(campaigns.map((campaign) => backupOneCampaign(campaign.id)));

  const errors: string[] = [];
  let succeeded = 0;
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      succeeded += 1;
    } else {
      const campaignId = campaigns[index]?.id ?? "desconhecida";
      console.error(`[cron/backup-campaigns] falha ao gerar backup da campanha ${campaignId}:`, result.reason);
      errors.push(campaignId);
    }
  });

  return NextResponse.json({ campaigns: campaigns.length, succeeded, failed: errors.length, failedCampaignIds: errors });
}

async function backupOneCampaign(campaignId: string) {
  const doc = await buildCampaignExport(campaignId);
  // `exportedAt` já é ISO 8601 (ver `buildCampaignExport`) — só trocamos os
  // caracteres que não servem em nome de arquivo/URL (`:`, `.`).
  const timestamp = doc.exportedAt.replace(/[:.]/g, "-");
  const pathname = `${campaignBackupsPrefix(campaignId)}${timestamp}.json`;

  await put(pathname, JSON.stringify(doc), { access: "public", contentType: "application/json" });

  await pruneOldSnapshots(campaignId);
}

async function pruneOldSnapshots(campaignId: string) {
  const { blobs } = await list({ prefix: campaignBackupsPrefix(campaignId) });
  const sorted = [...blobs].sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  const toDelete = sorted.slice(SNAPSHOTS_TO_KEEP);
  await Promise.all(toDelete.map((blob) => del(blob.url)));
}
