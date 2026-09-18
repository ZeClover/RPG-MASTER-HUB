import JSZip from "jszip";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/modules/core/auth/session";
import { CampaignAccessError, requireCampaignAccess } from "@/modules/core/permissions";
import { buildCampaignExport, summarizeExportCounts } from "@/modules/core/campaigns/export/export";

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "campanha"
  );
}

function buildReadme(doc: Awaited<ReturnType<typeof buildCampaignExport>>) {
  const counts = summarizeExportCounts(doc);
  const lines = [
    "RPG Master Hub — Backup de campanha",
    "",
    `Campanha: ${doc.campaign.name}`,
    `Exportado em: ${doc.exportedAt}`,
    `Formato: campaign-export.json (formatVersion ${doc.formatVersion})`,
    "",
    "Contagem de linhas por tipo de conteúdo:",
    ...counts.map(({ label, count }) => `  - ${label}: ${count}`),
    "",
    "Este arquivo pode conter segredos e anotações que só o mestre deveria ver",
    "(campos GM_ONLY, notas de mestre, segredos de NPCs/facções). Mantenha-o privado.",
    "",
    "Para restaurar: RPG Master Hub → Início → \"Importar campanha\". O import",
    "SEMPRE cria uma campanha nova — nunca sobrescreve uma campanha existente.",
  ];
  return lines.join("\n");
}

interface RouteParams {
  params: Promise<{ campaignId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { campaignId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    await requireCampaignAccess(user.id, campaignId, "OWNER");
  } catch (error) {
    if (error instanceof CampaignAccessError) {
      return NextResponse.json({ error: "Sem permissão nesta campanha." }, { status: 403 });
    }
    throw error;
  }

  const doc = await buildCampaignExport(campaignId);

  const zip = new JSZip();
  zip.file("campaign-export.json", JSON.stringify(doc, null, 2));
  zip.file("LEIA-ME.txt", buildReadme(doc));
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  const date = doc.exportedAt.slice(0, 10);
  const filename = `${slugify(doc.campaign.name)}-${date}.zip`;

  return new NextResponse(new Uint8Array(zipBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
