import "server-only";

import { slugifyTagName } from "@/modules/creation/tags/slug";

/**
 * Gera uma `key` única (token de fórmula `{key}`) a partir de um nome —
 * mesmo utilitário de slug de `createTagAction` (`slugifyTagName`), mas
 * adaptado: em vez de devolver a linha existente em caso de colisão (como
 * `Tag` faz, onde nome duplicado = mesma tag), aqui cada `AttributeDef`/
 * `ResourceDef`/`SkillDef` precisa de uma `key` própria dentro da campanha
 * (`@@unique([campaignId, key])`) — colisão é resolvida acrescentando um
 * sufixo numérico (`forca`, `forca-2`, `forca-3`, …) até achar uma livre.
 */
export async function generateUniqueDefKey(
  name: string,
  keyExists: (candidate: string) => Promise<boolean>,
): Promise<string | null> {
  const base = slugifyTagName(name);
  if (!base) return null;

  let candidate = base;
  let attempt = 2;
  while (await keyExists(candidate)) {
    candidate = `${base}-${attempt}`;
    attempt += 1;
  }
  return candidate;
}
