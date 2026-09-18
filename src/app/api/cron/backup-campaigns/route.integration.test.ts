import { randomUUID } from "node:crypto";

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
  list: vi.fn(),
  del: vi.fn(),
}));

import { del, list, put } from "@vercel/blob";

import { db } from "@/lib/db";
import { campaignBackupsPrefix } from "@/modules/core/campaigns/export/backups";
import { GET } from "@/app/api/cron/backup-campaigns/route";

/**
 * Fase 12, Part 4/6 — a rota do cron nunca é chamada de verdade pela Vercel a
 * partir deste sandbox (ver ARCHITECTURE.md), então testamos o handler
 * diretamente: o gate de autenticação por `CRON_SECRET` (a parte mais
 * arriscada de errar) e a lógica de "sobe 1 snapshot, apaga além dos 7 mais
 * recentes" contra um `@vercel/blob` mockado.
 *
 * O banco já tem outras campanhas ACTIVE de testes manuais anteriores deste
 * projeto — por isso o mock de `list` é sensível ao prefixo: só devolve os
 * blobs falsos quando o prefixo é o DESTA campanha de teste, senão devolve
 * lista vazia. Isso mantém as asserções exatas mesmo com outras campanhas no
 * banco disparando o mesmo cron.
 */
describe("GET /api/cron/backup-campaigns", () => {
  const originalSecret = process.env.CRON_SECRET;
  let ownerId: string;
  let campaignId: string;

  function makeRequest(headers: Record<string, string> = {}) {
    return new Request("http://localhost/api/cron/backup-campaigns", { headers });
  }

  beforeAll(async () => {
    const suffix = randomUUID().slice(0, 8);
    const owner = await db.user.create({ data: { name: "Cron Test Owner", email: `cron-owner-${suffix}@test.local` } });
    ownerId = owner.id;
    const campaign = await db.campaign.create({
      data: {
        name: "Campanha ativa para teste do cron",
        ownerId,
        status: "ACTIVE",
        members: { create: { userId: ownerId, role: "OWNER" } },
      },
    });
    campaignId = campaign.id;
  });

  afterAll(async () => {
    await db.campaign.deleteMany({ where: { id: campaignId } });
    await db.user.deleteMany({ where: { id: ownerId } });
  });

  beforeEach(() => {
    vi.mocked(put).mockReset().mockResolvedValue({ url: "https://blob.example/mock.json", pathname: "mock.json" } as never);
    vi.mocked(list)
      .mockReset()
      .mockResolvedValue({ blobs: [], cursor: undefined, hasMore: false } as never);
    vi.mocked(del).mockReset().mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
  });

  it("recusa rodar (401) quando CRON_SECRET não está configurado — fail closed", async () => {
    delete process.env.CRON_SECRET;
    const response = await GET(makeRequest({ authorization: "Bearer qualquer-coisa" }));
    expect(response.status).toBe(401);
    expect(put).not.toHaveBeenCalled();
  });

  it("recusa (401) um bearer token incorreto", async () => {
    process.env.CRON_SECRET = "o-segredo-certo";
    const response = await GET(makeRequest({ authorization: "Bearer segredo-errado" }));
    expect(response.status).toBe(401);
    expect(put).not.toHaveBeenCalled();
  });

  it("recusa (401) quando não há header Authorization nenhum", async () => {
    process.env.CRON_SECRET = "o-segredo-certo";
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
    expect(put).not.toHaveBeenCalled();
  });

  it(
    "roda (200) com o bearer token correto e escreve um snapshot JSON no Blob para a campanha ACTIVE",
    async () => {
      process.env.CRON_SECRET = "o-segredo-certo";
      const response = await GET(makeRequest({ authorization: "Bearer o-segredo-certo" }));
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.succeeded).toBeGreaterThanOrEqual(1);
      expect(body.failed).toBe(0);

      const callForThisCampaign = vi
        .mocked(put)
        .mock.calls.find(([pathname]) => (pathname as string).startsWith(campaignBackupsPrefix(campaignId)));
      expect(callForThisCampaign).toBeDefined();
      const [pathname, , options] = callForThisCampaign!;
      expect(pathname).toMatch(/\.json$/);
      expect(options).toMatchObject({ access: "public", contentType: "application/json" });
    },
    60_000,
  );

  it(
    "apaga snapshots além dos 7 mais recentes desta campanha",
    async () => {
      process.env.CRON_SECRET = "o-segredo-certo";

      const prefix = campaignBackupsPrefix(campaignId);
      const fakeOldBlobs = Array.from({ length: 9 }, (_, index) => ({
        url: `https://blob.example/${prefix}old-${index}.json`,
        downloadUrl: `https://blob.example/${prefix}old-${index}.json`,
        pathname: `${prefix}old-${index}.json`,
        size: 100,
        uploadedAt: new Date(Date.now() - index * 60_000),
        etag: `etag-${index}`,
      }));

      vi.mocked(list).mockImplementation(async ({ prefix: requestedPrefix } = {}) => {
        if (requestedPrefix === prefix) {
          return { blobs: fakeOldBlobs, cursor: undefined, hasMore: false } as never;
        }
        return { blobs: [], cursor: undefined, hasMore: false } as never;
      });

      const response = await GET(makeRequest({ authorization: "Bearer o-segredo-certo" }));
      expect(response.status).toBe(200);

      // 9 existentes, mantém os 7 mais recentes → apaga os 2 mais antigos.
      expect(del).toHaveBeenCalledTimes(2);
      const deletedUrls = vi.mocked(del).mock.calls.map(([url]) => url);
      expect(deletedUrls).toContain(`https://blob.example/${prefix}old-7.json`);
      expect(deletedUrls).toContain(`https://blob.example/${prefix}old-8.json`);
    },
    60_000,
  );
});
