import "server-only";

import { list } from "@vercel/blob";

/** Prefixo Blob usado tanto pelo cron de backup (Part 4) quanto por esta listagem. */
export function campaignBackupsPrefix(campaignId: string) {
  return `backups/${campaignId}/`;
}

export interface CampaignBackupSnapshot {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
}

/**
 * Lista os snapshots automáticos de uma campanha no Vercel Blob, mais novo
 * primeiro — para a lista "Backups automáticos" em Configurações → Dados.
 *
 * Devolve `[]` (em vez de lançar) quando o Blob não está configurado (sem
 * `BLOB_READ_WRITE_TOKEN`, comum em desenvolvimento local com
 * `STORAGE_PROVIDER=local`) — a seção some/fica vazia, o resto da página
 * continua funcionando.
 */
export async function listCampaignBackupSnapshots(campaignId: string): Promise<CampaignBackupSnapshot[]> {
  try {
    const { blobs } = await list({ prefix: campaignBackupsPrefix(campaignId) });
    return blobs
      .map((blob) => ({ url: blob.url, pathname: blob.pathname, size: blob.size, uploadedAt: blob.uploadedAt }))
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  } catch {
    return [];
  }
}
