"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { generateUniqueDefKey } from "@/modules/gametools/system/key";
import {
  attributeDefFormSchema,
  resourceDefFormSchema,
  skillDefFormSchema,
  conditionDefFormSchema,
} from "@/modules/gametools/system/schemas";

export type SystemFormState =
  | {
      errors?: Partial<Record<string, string[]>>;
      error?: string;
      message?: string;
    }
  | undefined;

function n(value: string | undefined) {
  return value ? value : null;
}

function basePath(campaignId: string, section: string) {
  return `/campaigns/${campaignId}/system/${section}`;
}

function revalidateSystem(campaignId: string, section: string) {
  revalidatePath(basePath(campaignId, section));
}

// ── Atributos ────────────────────────────────────────────────────────────

function attributeRawEntries(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
    defaultValue: formData.get("defaultValue") || "0",
    gmOnly: formData.get("gmOnly") || undefined,
  };
}

export async function createAttributeAction(
  campaignId: string,
  _prevState: SystemFormState,
  formData: FormData,
): Promise<SystemFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = attributeDefFormSchema.safeParse(attributeRawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const key = await generateUniqueDefKey(parsed.data.name, async (candidate) => {
    const existing = await db.attributeDef.findUnique({ where: { campaignId_key: { campaignId, key: candidate } } });
    return Boolean(existing);
  });
  if (!key) return { error: "Nome inválido — não foi possível gerar um identificador." };

  const last = await db.attributeDef.findFirst({ where: { campaignId }, orderBy: { order: "desc" }, select: { order: true } });

  await db.attributeDef.create({
    data: {
      campaignId,
      name: parsed.data.name,
      key,
      description: n(parsed.data.description),
      defaultValue: parsed.data.defaultValue,
      gmOnly: parsed.data.gmOnly === "on",
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidateSystem(campaignId, "attributes");
  return { message: "Atributo criado." };
}

export async function updateAttributeAction(
  campaignId: string,
  attributeId: string,
  _prevState: SystemFormState,
  formData: FormData,
): Promise<SystemFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = attributeDefFormSchema.safeParse(attributeRawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.attributeDef.updateMany({
    where: { id: attributeId, campaignId },
    data: {
      name: parsed.data.name,
      description: n(parsed.data.description),
      defaultValue: parsed.data.defaultValue,
      gmOnly: parsed.data.gmOnly === "on",
    },
  });

  revalidateSystem(campaignId, "attributes");
  revalidateSystem(campaignId, "formulas"); // exibição de "sem atributo relacionado" depende do nome
  return { message: "Atributo atualizado." };
}

export async function deleteAttributeAction(campaignId: string, attributeId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return { error: error.message };
    throw error;
  }

  // `SkillDef.relatedAttributeId` é `onDelete: SetNull` (ver schema.prisma) —
  // a perícia sobrevive como "sem atributo relacionado". Uma `RollFormulaDef`
  // que referencia esta `key` também sobrevive (ver ARCHITECTURE.md, Fase 13,
  // "excluir atributo/perícia referenciado por fórmula"): o diálogo de
  // confirmação já avisou o mestre quais fórmulas ficam com token
  // desconhecido antes de chegar aqui.
  await db.attributeDef.deleteMany({ where: { id: attributeId, campaignId } });

  revalidateSystem(campaignId, "attributes");
  revalidateSystem(campaignId, "skills");
  revalidateSystem(campaignId, "formulas");
}

// ── Recursos ─────────────────────────────────────────────────────────────

function resourceRawEntries(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
    defaultMax: formData.get("defaultMax") || "0",
    gmOnly: formData.get("gmOnly") || undefined,
  };
}

export async function createResourceAction(
  campaignId: string,
  _prevState: SystemFormState,
  formData: FormData,
): Promise<SystemFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = resourceDefFormSchema.safeParse(resourceRawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const key = await generateUniqueDefKey(parsed.data.name, async (candidate) => {
    const existing = await db.resourceDef.findUnique({ where: { campaignId_key: { campaignId, key: candidate } } });
    return Boolean(existing);
  });
  if (!key) return { error: "Nome inválido — não foi possível gerar um identificador." };

  const last = await db.resourceDef.findFirst({ where: { campaignId }, orderBy: { order: "desc" }, select: { order: true } });

  await db.resourceDef.create({
    data: {
      campaignId,
      name: parsed.data.name,
      key,
      description: n(parsed.data.description),
      defaultMax: parsed.data.defaultMax,
      gmOnly: parsed.data.gmOnly === "on",
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidateSystem(campaignId, "resources");
  return { message: "Recurso criado." };
}

export async function updateResourceAction(
  campaignId: string,
  resourceId: string,
  _prevState: SystemFormState,
  formData: FormData,
): Promise<SystemFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = resourceDefFormSchema.safeParse(resourceRawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.resourceDef.updateMany({
    where: { id: resourceId, campaignId },
    data: {
      name: parsed.data.name,
      description: n(parsed.data.description),
      defaultMax: parsed.data.defaultMax,
      gmOnly: parsed.data.gmOnly === "on",
    },
  });

  revalidateSystem(campaignId, "resources");
  return { message: "Recurso atualizado." };
}

export async function deleteResourceAction(campaignId: string, resourceId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return { error: error.message };
    throw error;
  }

  await db.resourceDef.deleteMany({ where: { id: resourceId, campaignId } });
  revalidateSystem(campaignId, "resources");
}

// ── Perícias ─────────────────────────────────────────────────────────────

function skillRawEntries(formData: FormData) {
  return {
    name: formData.get("name"),
    relatedAttributeId: formData.get("relatedAttributeId"),
    defaultBonus: formData.get("defaultBonus") || "0",
    gmOnly: formData.get("gmOnly") || undefined,
  };
}

async function resolveRelatedAttributeId(campaignId: string, relatedAttributeId: string | undefined) {
  if (!relatedAttributeId) return null;
  const attribute = await db.attributeDef.findFirst({ where: { id: relatedAttributeId, campaignId }, select: { id: true } });
  return attribute?.id ?? null;
}

export async function createSkillAction(
  campaignId: string,
  _prevState: SystemFormState,
  formData: FormData,
): Promise<SystemFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = skillDefFormSchema.safeParse(skillRawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const key = await generateUniqueDefKey(parsed.data.name, async (candidate) => {
    const existing = await db.skillDef.findUnique({ where: { campaignId_key: { campaignId, key: candidate } } });
    return Boolean(existing);
  });
  if (!key) return { error: "Nome inválido — não foi possível gerar um identificador." };

  const last = await db.skillDef.findFirst({ where: { campaignId }, orderBy: { order: "desc" }, select: { order: true } });

  await db.skillDef.create({
    data: {
      campaignId,
      name: parsed.data.name,
      key,
      relatedAttributeId: await resolveRelatedAttributeId(campaignId, parsed.data.relatedAttributeId),
      defaultBonus: parsed.data.defaultBonus,
      gmOnly: parsed.data.gmOnly === "on",
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidateSystem(campaignId, "skills");
  return { message: "Perícia criada." };
}

export async function updateSkillAction(
  campaignId: string,
  skillId: string,
  _prevState: SystemFormState,
  formData: FormData,
): Promise<SystemFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = skillDefFormSchema.safeParse(skillRawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.skillDef.updateMany({
    where: { id: skillId, campaignId },
    data: {
      name: parsed.data.name,
      relatedAttributeId: await resolveRelatedAttributeId(campaignId, parsed.data.relatedAttributeId),
      defaultBonus: parsed.data.defaultBonus,
      gmOnly: parsed.data.gmOnly === "on",
    },
  });

  revalidateSystem(campaignId, "skills");
  return { message: "Perícia atualizada." };
}

export async function deleteSkillAction(campaignId: string, skillId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return { error: error.message };
    throw error;
  }

  await db.skillDef.deleteMany({ where: { id: skillId, campaignId } });
  revalidateSystem(campaignId, "skills");
  revalidateSystem(campaignId, "formulas");
}

// ── Condições ────────────────────────────────────────────────────────────

function conditionRawEntries(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
    color: formData.get("color") || "",
  };
}

export async function createConditionAction(
  campaignId: string,
  _prevState: SystemFormState,
  formData: FormData,
): Promise<SystemFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = conditionDefFormSchema.safeParse(conditionRawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const last = await db.conditionDef.findFirst({ where: { campaignId }, orderBy: { order: "desc" }, select: { order: true } });

  await db.conditionDef.create({
    data: {
      campaignId,
      name: parsed.data.name,
      description: n(parsed.data.description),
      color: parsed.data.color || null,
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidateSystem(campaignId, "conditions");
  return { message: "Condição criada." };
}

export async function updateConditionAction(
  campaignId: string,
  conditionId: string,
  _prevState: SystemFormState,
  formData: FormData,
): Promise<SystemFormState> {
  const user = await requireUser();
  await requireCampaignAccess(user.id, campaignId, "CO_GM");

  const parsed = conditionDefFormSchema.safeParse(conditionRawEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await db.conditionDef.updateMany({
    where: { id: conditionId, campaignId },
    data: {
      name: parsed.data.name,
      description: n(parsed.data.description),
      color: parsed.data.color || null,
    },
  });

  revalidateSystem(campaignId, "conditions");
  return { message: "Condição atualizada." };
}

export async function deleteConditionAction(campaignId: string, conditionId: string) {
  const user = await requireUser();
  try {
    await requireCampaignAccess(user.id, campaignId, "CO_GM");
  } catch (error) {
    if (error instanceof CampaignAccessError) return { error: error.message };
    throw error;
  }

  await db.conditionDef.deleteMany({ where: { id: conditionId, campaignId } });
  revalidateSystem(campaignId, "conditions");
}

// `order` segue o mesmo padrão de `RollTableEntry`/`MonsterAttribute` (ver
// ARCHITECTURE.md): sem reordenação por arrastar/subir-descer em lugar
// nenhum do código-base — só é atribuído na criação, sempre ao final da
// lista atual (ver `last?.order ?? -1) + 1` em cada `create*Action` acima).
