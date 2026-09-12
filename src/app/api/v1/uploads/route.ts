import { NextResponse } from "next/server";

import { getCurrentUser } from "@/modules/core/auth/session";
import { CampaignAccessError, requireCampaignAccess } from "@/modules/core/permissions";
import { storage } from "@/lib/storage";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const campaignId = formData.get("campaignId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Formato de imagem não suportado." }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Arquivo maior que 5MB." }, { status: 400 });
  }

  let folder = `users/${user.id}`;

  if (typeof campaignId === "string" && campaignId.length > 0) {
    try {
      await requireCampaignAccess(user.id, campaignId, "OWNER");
    } catch (error) {
      if (error instanceof CampaignAccessError) {
        return NextResponse.json({ error: "Sem permissão nesta campanha." }, { status: 403 });
      }
      throw error;
    }
    folder = `campaigns/${campaignId}`;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await storage.upload({
    buffer,
    filename: file.name,
    contentType: file.type,
    folder,
  });

  return NextResponse.json(result);
}
