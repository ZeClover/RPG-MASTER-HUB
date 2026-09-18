import "server-only";

import { db } from "@/lib/db";
import type { CampaignRole } from "@/generated/prisma/client";
import { requireCampaignAccess, isPlayerRole } from "@/modules/core/permissions";
import { extractFormulaTokens } from "@/lib/formula";

/**
 * Leitura de toda definição do Construtor de Sistema é nível PLAYER (ver
 * ARCHITECTURE.md, Fase 13) — são as regras do próprio sistema de jogo, não
 * uma ferramenta de bastidor do mestre (diferente de `RollTable`, que exige
 * CO_GM até para ver). `gmOnly` por linha ("campo secreto da ficha") é o
 * único filtro: um PLAYER não vê a linha, CO_GM/OWNER veem tudo.
 */
function filterGmOnlyForRole<T extends { gmOnly: boolean }>(items: T[], role: CampaignRole): T[] {
  if (!isPlayerRole(role)) return items;
  return items.filter((item) => !item.gmOnly);
}

function orderByDefault() {
  return [{ order: "asc" as const }, { createdAt: "asc" as const }];
}

export async function listAttributes(userId: string, campaignId: string) {
  const { role } = await requireCampaignAccess(userId, campaignId);
  const attributes = await db.attributeDef.findMany({ where: { campaignId }, orderBy: orderByDefault() });
  return filterGmOnlyForRole(attributes, role);
}

export async function listResources(userId: string, campaignId: string) {
  const { role } = await requireCampaignAccess(userId, campaignId);
  const resources = await db.resourceDef.findMany({ where: { campaignId }, orderBy: orderByDefault() });
  return filterGmOnlyForRole(resources, role);
}

export async function listSkills(userId: string, campaignId: string) {
  const { role } = await requireCampaignAccess(userId, campaignId);
  const skills = await db.skillDef.findMany({
    where: { campaignId },
    orderBy: orderByDefault(),
    include: { relatedAttribute: true },
  });
  return filterGmOnlyForRole(skills, role);
}

export async function listConditions(userId: string, campaignId: string) {
  const { role } = await requireCampaignAccess(userId, campaignId);
  // ConditionDef não tem `gmOnly` (catálogo sempre visível — ver schema.prisma).
  void role;
  return db.conditionDef.findMany({ where: { campaignId }, orderBy: orderByDefault() });
}

export async function listRollFormulas(userId: string, campaignId: string) {
  await requireCampaignAccess(userId, campaignId);
  // RollFormulaDef não tem `gmOnly` — uma fórmula é sempre visível a quem
  // pode ver a campanha (o token que ela referencia é que pode ser secreto).
  return db.rollFormulaDef.findMany({ where: { campaignId }, orderBy: orderByDefault() });
}

export async function listSheetSections(userId: string, campaignId: string) {
  const { role } = await requireCampaignAccess(userId, campaignId);
  const sections = await db.sheetSection.findMany({ where: { campaignId }, orderBy: orderByDefault() });
  return filterGmOnlyForRole(sections, role);
}

/**
 * As 6 listas de uma vez — usado pelo editor de fórmulas (o seletor de
 * tokens precisa saber toda `key` de Atributo/Perícia existente) e por
 * qualquer outra tela que precise do panorama completo do sistema.
 */
export async function getSystemSummary(userId: string, campaignId: string) {
  const { role } = await requireCampaignAccess(userId, campaignId);

  const [attributes, resources, skills, conditions, formulas, sections] = await Promise.all([
    db.attributeDef.findMany({ where: { campaignId }, orderBy: orderByDefault() }),
    db.resourceDef.findMany({ where: { campaignId }, orderBy: orderByDefault() }),
    db.skillDef.findMany({ where: { campaignId }, orderBy: orderByDefault(), include: { relatedAttribute: true } }),
    db.conditionDef.findMany({ where: { campaignId }, orderBy: orderByDefault() }),
    db.rollFormulaDef.findMany({ where: { campaignId }, orderBy: orderByDefault() }),
    db.sheetSection.findMany({ where: { campaignId }, orderBy: orderByDefault() }),
  ]);

  return {
    attributes: filterGmOnlyForRole(attributes, role),
    resources: filterGmOnlyForRole(resources, role),
    skills: filterGmOnlyForRole(skills, role),
    conditions,
    formulas,
    sections: filterGmOnlyForRole(sections, role),
  };
}

/** Todo `AttributeDef`/`SkillDef` da campanha vira uma `key → nome` — usado para resolver o token picker do editor de fórmulas e os valores padrão do "Testar fórmula" (Part 4). Sempre a visão completa (CO_GM), nunca filtrada por `gmOnly` — quem monta a fórmula é sempre CO_GM. */
export async function getFormulaTokenSources(campaignId: string) {
  const [attributes, skills] = await Promise.all([
    db.attributeDef.findMany({ where: { campaignId }, select: { key: true, name: true, defaultValue: true } }),
    db.skillDef.findMany({ where: { campaignId }, select: { key: true, name: true, defaultBonus: true } }),
  ]);
  return { attributes, skills };
}

/**
 * Nomes das fórmulas que referenciam `key` (usado no diálogo de confirmação
 * ao excluir um Atributo/Perícia — ver ARCHITECTURE.md, Fase 13, para a
 * decisão de permitir a exclusão mas avisar em vez de bloquear).
 */
export function formulaNamesReferencingKey(formulas: Array<{ name: string; formula: string }>, key: string): string[] {
  return formulas.filter((formula) => extractFormulaTokens(formula.formula).includes(key)).map((formula) => formula.name);
}

/** Toda fórmula cujo texto referencia uma `key` que não existe mais em `knownKeys` — usado para sinalizar fórmulas "quebradas" na listagem (ver Part 3). */
export function unknownTokensByFormula(
  formulas: Array<{ id: string; formula: string }>,
  knownKeys: Set<string>,
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const formula of formulas) {
    const unknown = extractFormulaTokens(formula.formula).filter((token) => !knownKeys.has(token));
    if (unknown.length > 0) map.set(formula.id, unknown);
  }
  return map;
}
