"use server";

import JSZip from "jszip";

import { requireUser } from "@/modules/core/auth/session";
import { campaignExportSchema } from "@/modules/core/campaigns/export/schemas";
import { importCampaignExport, type ImportSummary } from "@/modules/core/campaigns/export/import";

export type ImportCampaignFormState =
  | {
      error?: string;
      success?: { campaignId: string; campaignName: string; summary: ImportSummary };
    }
  | undefined;

/**
 * Fase 12, Part 2 — Server Action de import. Regra de ouro: SEMPRE cria uma
 * campanha nova (nunca sobrescreve/mescla) — a garantia de verdade vive em
 * `importCampaignExport`; esta action só faz o trabalho de borda (ler o
 * upload, abrir o zip, validar o shape) e traduz erros para o formato de
 * estado que `useActionState` espera (ver `createHandoutAction`/
 * `createCampaignAction` para o mesmo padrão).
 *
 * Deliberadamente NÃO chama `redirect()`: o resumo do import (contagens,
 * avisos como personagens reatribuídos ou relações ignoradas) precisa
 * aparecer para quem importou ANTES de navegar para a campanha nova — um
 * `redirect()" aqui jogaria fora esse estado antes de ele ser renderizado. O
 * diálogo (`ImportCampaignDialog`) mostra o resumo e oferece o link para a
 * campanha nova, que é a mesma experiência final (só que sem pular a etapa
 * "veja o que veio no arquivo").
 */
export async function importCampaignAction(
  _prevState: ImportCampaignFormState,
  formData: FormData,
): Promise<ImportCampaignFormState> {
  const user = await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo de backup (.zip) para importar." };
  }

  let json: unknown;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);
    const entry = zip.file("campaign-export.json");
    if (!entry) {
      return { error: "Arquivo inválido: não encontramos campaign-export.json dentro do .zip." };
    }
    const text = await entry.async("string");
    json = JSON.parse(text);
  } catch {
    return {
      error: "Não foi possível ler o arquivo. Confirme que é um .zip de backup gerado pelo RPG Master Hub.",
    };
  }

  const parsed = campaignExportSchema.safeParse(json);
  if (!parsed.success) {
    return { error: "Arquivo de backup em formato inválido ou de uma versão não suportada." };
  }

  try {
    const { campaignId, summary } = await importCampaignExport(user.id, parsed.data);
    return { success: { campaignId, campaignName: parsed.data.campaign.name, summary } };
  } catch (error) {
    console.error("Falha ao importar campanha:", error);
    return { error: "Não foi possível importar o backup — nenhuma campanha foi criada." };
  }
}
