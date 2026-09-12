# RPG Master Hub

O sistema operacional para Mestres de RPG organizarem, prepararem e narrarem campanhas que duram meses ou anos.

Este repositório está na **Fase 3 — Modo Sessão**: Dice Roller, Session Log, Combat Tracker, NPC rápido e Botão do pânico — com fila de escrita offline de verdade (funciona mesmo sem internet no meio da mesa) — construídos sobre a Fase 2 (Session Planner, Missões, Tramas, Consequências), a Fase 1 (NPCs, Locais, Facções, Lore, Idea Vault, Tags, Relacionamentos, Busca global, Command Palette) e a Fase 0 (autenticação, campanhas, layout, PWA). Veja [`ARCHITECTURE.md`](./ARCHITECTURE.md) para as decisões técnicas e o roadmap completo por fases.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 7 + PostgreSQL · Auth.js v5 · Zustand · TanStack Query · Radix UI

## Rodando localmente

Pré-requisitos: Node 20.9+, pnpm, um PostgreSQL acessível.

```bash
pnpm install
cp .env.example .env        # preencha DATABASE_URL e AUTH_SECRET
pnpm db:migrate              # aplica o schema no banco
pnpm dev                     # http://localhost:3000
```

Gerar um `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

## Scripts

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | servidor de desenvolvimento (Turbopack) |
| `pnpm build` | build de produção |
| `pnpm start` | serve o build de produção |
| `pnpm lint` | ESLint |
| `pnpm db:migrate` | aplica migrações do Prisma (`prisma migrate dev`) |
| `pnpm db:studio` | abre o Prisma Studio |

## Storage de imagens

Em desenvolvimento, uploads (ícone/banner/imagem de campanha) são gravados em `public/uploads` (git-ignorado). Em produção, defina `STORAGE_PROVIDER=vercel-blob` e `BLOB_READ_WRITE_TOKEN` para usar o Vercel Blob — a troca de provider não exige mudança de código, veja `src/lib/storage`.

## Estrutura

Veja [`ARCHITECTURE.md`](./ARCHITECTURE.md) para a estrutura de pastas, o modelo de dados, estratégias de autenticação/permissões/sincronização e o roadmap de fases.
