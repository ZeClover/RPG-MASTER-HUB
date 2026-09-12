import "server-only";

import { localStorageProvider } from "./local-provider";
import { vercelBlobStorageProvider } from "./vercel-blob-provider";
import type { StorageProvider } from "./types";

export type { StorageProvider, UploadResult, UploadParams } from "./types";

function resolveProvider(): StorageProvider {
  const configured = process.env.STORAGE_PROVIDER;
  if (configured === "vercel-blob") return vercelBlobStorageProvider;
  if (configured === "local") return localStorageProvider;
  // Sem configuração explícita: usa Vercel Blob quando implantado na Vercel,
  // e disco local em desenvolvimento.
  return process.env.VERCEL ? vercelBlobStorageProvider : localStorageProvider;
}

export const storage = resolveProvider();
