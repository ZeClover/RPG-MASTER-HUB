import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

import type { StorageProvider } from "./types";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

/**
 * Grava no filesystem local (public/uploads). Só é apropriado para desenvolvimento —
 * em produção na Vercel o filesystem é efêmero e somente leitura, por isso o
 * provider é escolhido automaticamente com base no ambiente (ver lib/storage/index.ts).
 */
export const localStorageProvider: StorageProvider = {
  async upload({ buffer, filename, folder }) {
    const safeFolder = folder.replace(/[^a-zA-Z0-9_\-/]/g, "");
    const ext = path.extname(filename);
    const key = `${safeFolder}/${randomUUID()}${ext}`;
    const destPath = path.join(UPLOAD_ROOT, key);

    await mkdir(path.dirname(destPath), { recursive: true });
    await writeFile(destPath, buffer);

    return { url: `/uploads/${key}`, key };
  },

  async delete(key) {
    const destPath = path.join(UPLOAD_ROOT, key);
    await unlink(destPath).catch(() => undefined);
  },
};
