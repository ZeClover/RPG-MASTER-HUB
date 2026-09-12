import { NextResponse } from "next/server";

import { getCurrentUser } from "@/modules/core/auth/session";
import { CampaignAccessError, requireCampaignAccess } from "@/modules/core/permissions";
import { storage } from "@/lib/storage";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_AUDIO_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const ALLOWED_AUDIO_TYPES = new Set(["audio/mpeg", "audio/mp3", "audio/ogg", "audio/wav", "audio/webm"]);

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

  const isImage = ALLOWED_IMAGE_TYPES.has(file.type);
  const isAudio = ALLOWED_AUDIO_TYPES.has(file.type);

  if (!isImage && !isAudio) {
    return NextResponse.json({ error: "Formato de arquivo não suportado." }, { status: 400 });
  }

  const maxSize = isAudio ? MAX_AUDIO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
  if (file.size > maxSize) {
    return NextResponse.json({ error: `Arquivo maior que ${maxSize / (1024 * 1024)}MB.` }, { status: 400 });
  }

  let folder = `users/${user.id}`;

  if (typeof campaignId === "string" && campaignId.length > 0) {
    try {
      await requireCampaignAccess(user.id, campaignId, "CO_GM");
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
