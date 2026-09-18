"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { validateFormulaTokens } from "@/lib/formula";
import { rollFormulaDefFormSchema } from "@/modules/gametools/system/schemas";
import type { SystemFormState } from "@/modules/gametools/system/actions";

function n(value: string | undefined) {
  return value ? value : null;
}

function rawEntries(formData: FormData) {
  return {
    name: formData.get("name"),
    formula: formData.get("formula"),
    description: formData.get("description"),
  };
}

/** As `key`s conhecidas da campanha (Atributos + Perícias) — toda fórmula só pode referenciar tokens desta lista. */
async function knownFormulaKeys(campaignId: string): Promise<Set<string>> {
  const [attributes, skills] = await Promise.all([
    db.attributeDef.findMany({ where: { campaignId }, select: { key: true } }),
    db.skillDef.findMany({ where: { campaignId }, select: { key: true } }),
  ]);
  return new Set([...attributes.map((a) => a.key), ...skills.map((s) => s.key)]);
}

function unknownTokenError(unknownTokens: string[]): string {
  const list = unknownTokens.map((token) => `{${token}}`).join(", ");
  return `Esta fórmula referencia token(s) que não existem nesta campanha: ${list}. Crie o Atributo/Perícia correspondente primeiro, ou corrija a fórmula.`;
}

export async function createRollFormulaAction(
  campaignId: string,
  _prevState: SystemFormState,
  formData: FormData,
): Promise<SystemFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = rollFormulaDefFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const knownKeys = await knownFormulaKeys(campaignId);
  const unknownTokens = validateFormulaTokens(parsed.data.formula, knownKeys);
  if (unknownTokens.length > 0) {
    return { error: unknownTokenError(unknownTokens) };
  }

  const last = await db.rollFormulaDef.findFirst({
    where: { campaignId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await db.rollFormulaDef.create({
    data: {
      campaignId,
      name: parsed.data.name,
      formula: parsed.data.formula,
      description: n(parsed.data.description),
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidatePath(`/campaigns/${campaignId}/system/formulas`);
  return { message: "Fórmula criada." };
}

export async function updateRollFormulaAction(
  campaignId: string,
  formulaId: string,
  _prevState: SystemFormState,
  formData: FormData,
): Promise<SystemFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = rollFormulaDefFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const knownKeys = await knownFormulaKeys(campaignId);
  const unknownTokens = validateFormulaTokens(parsed.data.formula, knownKeys);
  if (unknownTokens.length > 0) {
    return { error: unknownTokenError(unknownTokens) };
  }

  await db.rollFormulaDef.updateMany({
    where: { id: formulaId, campaignId },
    data: {
      name: parsed.data.name,
      formula: parsed.data.formula,
      description: n(parsed.data.description),
    },
  });

  revalidatePath(`/campaigns/${campaignId}/system/formulas`);
  return { message: "Fórmula atualizada." };
}

export async function deleteRollFormulaAction(campaignId: string, formulaId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return { error: error.message };
    throw error;
  }

  await db.rollFormulaDef.deleteMany({ where: { id: formulaId, campaignId } });
  revalidatePath(`/campaigns/${campaignId}/system/formulas`);
}
