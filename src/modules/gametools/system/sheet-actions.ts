"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import type { SheetSectionKind } from "@/generated/prisma/client";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { sheetSectionFormSchema } from "@/modules/gametools/system/schemas";
import type { SystemFormState } from "@/modules/gametools/system/actions";

function n(value: string | undefined) {
  return value ? value : null;
}

function rawEntries(formData: FormData) {
  return {
    kind: formData.get("kind"),
    title: formData.get("title"),
    customText: formData.get("customText"),
    gmOnly: formData.get("gmOnly") || undefined,
  };
}

function revalidateSheet(campaignId: string) {
  revalidatePath(`/campaigns/${campaignId}/system/sheet`);
}

export async function createSheetSectionAction(
  campaignId: string,
  _prevState: SystemFormState,
  formData: FormData,
): Promise<SystemFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = sheetSectionFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const last = await db.sheetSection.findFirst({
    where: { campaignId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await db.sheetSection.create({
    data: {
      campaignId,
      kind: parsed.data.kind,
      title: parsed.data.title,
      customText: parsed.data.kind === "CUSTOM_TEXT" ? n(parsed.data.customText) : null,
      gmOnly: parsed.data.gmOnly === "on",
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidateSheet(campaignId);
  return { message: "Seção criada." };
}

export async function updateSheetSectionAction(
  campaignId: string,
  sectionId: string,
  _prevState: SystemFormState,
  formData: FormData,
): Promise<SystemFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = sheetSectionFormSchema.safeParse(rawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.sheetSection.updateMany({
    where: { id: sectionId, campaignId },
    data: {
      kind: parsed.data.kind,
      title: parsed.data.title,
      customText: parsed.data.kind === "CUSTOM_TEXT" ? n(parsed.data.customText) : null,
      gmOnly: parsed.data.gmOnly === "on",
    },
  });

  revalidateSheet(campaignId);
  return { message: "Seção atualizada." };
}

export async function deleteSheetSectionAction(campaignId: string, sectionId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return { error: error.message };
    throw error;
  }

  await db.sheetSection.deleteMany({ where: { id: sectionId, campaignId } });
  revalidateSheet(campaignId);
}

/** Ordem/rótulo padrão sugerido ao mestre — `CUSTOM_TEXT` fica de fora (não tem sentido "padrão" para texto livre; ver ARCHITECTURE.md, Fase 13). */
const DEFAULT_SECTIONS: Array<{ kind: SheetSectionKind; title: string }> = [
  { kind: "ATTRIBUTES", title: "Atributos" },
  { kind: "RESOURCES", title: "Recursos" },
  { kind: "SKILLS", title: "Perícias" },
  { kind: "CONDITIONS", title: "Condições" },
  { kind: "FORMULAS", title: "Fórmulas de rolagem" },
];

/**
 * Afordância "criar seções padrão" (ver ARCHITECTURE.md, Fase 13): um clique
 * cria uma `SheetSection` por `kind` (exceto `CUSTOM_TEXT`) na ordem sensata
 * acima, para uma campanha que ainda não tem nenhuma seção. Não sobrescreve
 * nem duplica seções já existentes — só preenche os `kind`s que faltam.
 */
export async function createDefaultSheetSectionsAction(campaignId: string): Promise<{ error?: string }> {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return { error: error.message };
    throw error;
  }

  const existing = await db.sheetSection.findMany({ where: { campaignId }, select: { kind: true } });
  const existingKinds = new Set(existing.map((section) => section.kind));

  const last = await db.sheetSection.findFirst({
    where: { campaignId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  let nextOrder = (last?.order ?? -1) + 1;

  const missing = DEFAULT_SECTIONS.filter((section) => !existingKinds.has(section.kind));
  if (missing.length > 0) {
    await db.sheetSection.createMany({
      data: missing.map((section) => ({
        campaignId,
        kind: section.kind,
        title: section.title,
        order: nextOrder++,
      })),
    });
  }

  revalidateSheet(campaignId);
  return {};
}
