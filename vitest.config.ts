import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Fase 12, Part 6 — infra de testes (ver ARCHITECTURE.md).
 *
 * O alias `@/*` espelha `tsconfig.json` na mão (um único alias, uma linha —
 * mais simples e menos frágil do que puxar o plugin `vite-tsconfig-paths`
 * só para isso).
 *
 * `server-only`/`client-only` não são pacotes reais no npm — o Next.js os
 * resolve internamente via alias do bundler para
 * `next/dist/compiled/{server,client}-only` (ver `node_modules/next/dist/build/webpack-config.js`).
 * Fora do Next (rodando testes puros com Vite/Vitest), o import quebraria com
 * "Cannot find module" — apontamos para os mesmos arquivos compilados que o
 * Next usa (o `server-only` real é um no-op; é exatamente o que testes de
 * servidor precisam).
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "node_modules/next/dist/compiled/server-only/empty.js"),
      "client-only": path.resolve(__dirname, "node_modules/next/dist/compiled/client-only/index.js"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,integration.test}.ts"],
    setupFiles: ["./vitest.setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
