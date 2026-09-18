import { describe, expect, it } from "vitest";

import {
  canRoleSeeVisibility,
  entityForRole,
  filterVisibleForRole,
  stripGmFields,
  visibilityWhereForRole,
} from "@/modules/core/permissions/visibility";
import type { CampaignRole, Visibility } from "@/generated/prisma/client";

const ROLES: CampaignRole[] = ["PLAYER", "CO_GM", "OWNER"];
const VISIBILITIES: Visibility[] = ["GM_ONLY", "PLAYERS", "PUBLIC"];

describe("canRoleSeeVisibility", () => {
  // Toda combinação role×visibility (3×3) — a única regra é "PLAYER nunca vê GM_ONLY".
  for (const role of ROLES) {
    for (const visibility of VISIBILITIES) {
      const expected = !(role === "PLAYER" && visibility === "GM_ONLY");
      it(`${role} × ${visibility} → ${expected}`, () => {
        expect(canRoleSeeVisibility(role, visibility)).toBe(expected);
      });
    }
  }
});

describe("entityForRole", () => {
  it("devolve null quando a entidade de entrada é null", () => {
    expect(entityForRole(null, "PLAYER")).toBeNull();
  });

  it("PLAYER não vê entidade GM_ONLY (null, mesmo shape do 'não encontrado')", () => {
    const entity = { id: "1", visibility: "GM_ONLY" as const };
    expect(entityForRole(entity, "PLAYER")).toBeNull();
  });

  it("PLAYER vê entidade PLAYERS/PUBLIC", () => {
    const playersEntity = { id: "1", visibility: "PLAYERS" as const };
    const publicEntity = { id: "2", visibility: "PUBLIC" as const };
    expect(entityForRole(playersEntity, "PLAYER")).toBe(playersEntity);
    expect(entityForRole(publicEntity, "PLAYER")).toBe(publicEntity);
  });

  it("CO_GM e OWNER veem qualquer visibilidade, inclusive GM_ONLY", () => {
    const entity = { id: "1", visibility: "GM_ONLY" as const };
    expect(entityForRole(entity, "CO_GM")).toBe(entity);
    expect(entityForRole(entity, "OWNER")).toBe(entity);
  });
});

describe("filterVisibleForRole", () => {
  const items = [
    { id: "1", visibility: "GM_ONLY" as const },
    { id: "2", visibility: "PLAYERS" as const },
    { id: "3", visibility: "PUBLIC" as const },
  ];

  it("PLAYER só recebe os itens não-GM_ONLY", () => {
    expect(filterVisibleForRole(items, "PLAYER").map((item) => item.id)).toEqual(["2", "3"]);
  });

  it("CO_GM e OWNER recebem a lista inteira, sem filtrar", () => {
    expect(filterVisibleForRole(items, "CO_GM")).toEqual(items);
    expect(filterVisibleForRole(items, "OWNER")).toEqual(items);
  });
});

describe("visibilityWhereForRole", () => {
  it("PLAYER recebe a condição 'not GM_ONLY'", () => {
    expect(visibilityWhereForRole("PLAYER")).toEqual({ not: "GM_ONLY" });
  });

  it("CO_GM e OWNER recebem undefined (sem filtro extra)", () => {
    expect(visibilityWhereForRole("CO_GM")).toBeUndefined();
    expect(visibilityWhereForRole("OWNER")).toBeUndefined();
  });
});

describe("stripGmFields", () => {
  it("devolve null quando a entidade de entrada é null", () => {
    expect(stripGmFields<{ secrets: string | null }, "secrets">(null, "PLAYER", ["secrets"])).toBeNull();
  });

  it("PLAYER: os campos listados viram null", () => {
    const entity = { id: "1", name: "Vilão", secrets: "é o irmão do rei", gmNotes: "usar para o clímax" };
    const stripped = stripGmFields(entity, "PLAYER", ["secrets", "gmNotes"]);
    expect(stripped).toEqual({ id: "1", name: "Vilão", secrets: null, gmNotes: null });
  });

  it("CO_GM e OWNER: a entidade volta intacta (mesma referência)", () => {
    const entity = { id: "1", name: "Vilão", secrets: "é o irmão do rei" };
    expect(stripGmFields(entity, "CO_GM", ["secrets"])).toBe(entity);
    expect(stripGmFields(entity, "OWNER", ["secrets"])).toBe(entity);
  });
});
