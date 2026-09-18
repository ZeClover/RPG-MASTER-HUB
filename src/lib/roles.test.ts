import { describe, expect, it } from "vitest";

import { CAMPAIGN_ROLE_RANK, roleAtLeast } from "@/lib/roles";
import type { CampaignRole } from "@/generated/prisma/client";

describe("CAMPAIGN_ROLE_RANK", () => {
  it("ordena PLAYER < CO_GM < OWNER", () => {
    expect(CAMPAIGN_ROLE_RANK.PLAYER).toBeLessThan(CAMPAIGN_ROLE_RANK.CO_GM);
    expect(CAMPAIGN_ROLE_RANK.CO_GM).toBeLessThan(CAMPAIGN_ROLE_RANK.OWNER);
  });
});

describe("roleAtLeast", () => {
  const roles: CampaignRole[] = ["PLAYER", "CO_GM", "OWNER"];

  it("um papel sempre satisfaz a si mesmo como mínimo", () => {
    for (const role of roles) {
      expect(roleAtLeast(role, role)).toBe(true);
    }
  });

  it("um papel maior satisfaz um mínimo menor", () => {
    expect(roleAtLeast("CO_GM", "PLAYER")).toBe(true);
    expect(roleAtLeast("OWNER", "PLAYER")).toBe(true);
    expect(roleAtLeast("OWNER", "CO_GM")).toBe(true);
  });

  it("um papel menor NÃO satisfaz um mínimo maior", () => {
    expect(roleAtLeast("PLAYER", "CO_GM")).toBe(false);
    expect(roleAtLeast("PLAYER", "OWNER")).toBe(false);
    expect(roleAtLeast("CO_GM", "OWNER")).toBe(false);
  });
});
