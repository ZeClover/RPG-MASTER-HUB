# RPG Master Hub

O sistema operacional para Mestres de RPG organizarem, prepararem e narrarem campanhas que duram meses ou anos.

Este repositório está na **Fase 5 — World Building**: Linha do Tempo (com um contador simples de "dia atual" da campanha embutido), Relógios Narrativos (padrão Powered by the Apocalypse/Blades in the Dark), Family Tree (parentesco entre NPCs) e Mystery Board (mistérios com pistas descobríveis, opcionalmente vinculadas a NPCs/Locais/etc.) — construídos sobre a Fase 4 (Music/SFX Board e os dois bots do Discord, em `bot/` — veja `bot/README.md`), a Fase 3 (Modo Sessão, Dice Roller, Session Log, Combat Tracker, NPC rápido, Botão do pânico, fila de escrita offline), a Fase 2 (Session Planner, Missões, Tramas, Consequências), a Fase 1 (NPCs, Locais, Facções, Lore, Idea Vault, Tags, Relacionamentos, Busca global, Command Palette) e a Fase 0 (autenticação, campanhas, layout, PWA). Veja [`ARCHITECTURE.md`](./ARCHITECTURE.md) para as decisões técnicas e o roadmap completo por fases.

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

Em desenvolvimento, uploads (ícone/banner/imagem de campanha, e agora faixas de áudio) são gravados em `public/uploads` (git-ignorado). Em produção, defina `STORAGE_PROVIDER=vercel-blob` e `BLOB_READ_WRITE_TOKEN` para usar o Vercel Blob — a troca de provider não exige mudança de código, veja `src/lib/storage`.

## Bots do Discord (Music/SFX Board)

O Music/SFX Board (`/campaigns/[campaignId]/audio`) precisa dos dois bots do Discord rodando para tocar música/efeitos de verdade — eles são um projeto Node separado em `bot/`, não fazem parte deste app. Veja [`bot/README.md`](./bot/README.md) para configuração e execução; só é preciso rodá-los durante a sessão, não 24/7.

## Estrutura

Veja [`ARCHITECTURE.md`](./ARCHITECTURE.md) para a estrutura de pastas, o modelo de dados, estratégias de autenticação/permissões/sincronização e o roadmap de fases.
