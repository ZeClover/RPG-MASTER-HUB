import "server-only";

import { randomUUID } from "node:crypto";
import path from "node:path";

import { del, put } from "@vercel/blob";

import type { StorageProvider } from "./types";

export const vercelBlobStorageProvider: StorageProvider = {
  async upload({ buffer, filename, contentType, folder }) {
    const ext = path.extname(filename);
    const key = `${folder}/${randomUUID()}${ext}`;
    const blob = await put(key, buffer, { access: "public", contentType });
    return { url: blob.url, key: blob.pathname };
  },

  async delete(key) {
    await del(key);
  },
};
