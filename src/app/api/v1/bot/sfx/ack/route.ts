import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { isAuthorizedBotRequest } from "@/lib/bot-auth";

export async function POST(request: Request) {
  if (!isAuthorizedBotRequest(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? body.ids.filter((id): id is string => typeof id === "string") : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "Nenhum id informado." }, { status: 400 });
  }

  await db.sfxTriggerEvent.updateMany({ where: { id: { in: ids } }, data: { processedAt: new Date() } });

  return NextResponse.json({ ok: true });
}
