# RPG Master Hub

O sistema operacional para Mestres de RPG organizarem, prepararem e narrarem campanhas que duram meses ou anos.

Este repositório concluiu a **Fase 9 — Jogadores**, última fase do roadmap original: convite/gestão de Co-Mestres e Jogadores (`/campaigns/[id]/members`), Player View (filtragem real de `visibility` — um jogador não vê mais conteúdo `GM_ONLY`, nem campos como notas/segredos do mestre), Player Knowledge (botão "Revelar aos jogadores" para liberar conteúdo em tempo real durante a sessão) e Handouts (documentos/imagens entregues aos jogadores, com revelar/ocultar). Construída sobre a Fase 8 (Lore Guardian, Canon Checker, Campaign Recall, Consequence Suggester — geração processual 100% local, zero LLM, ver `ARCHITECTURE.md` seção 19.0), a Fase 7 (Campaign Brain avançado, Context Engine, Campaign Health, Content Graveyard), a Fase 6 (Monster/Boss/Item Forge, Power Builder, Table Builder, Loot Generator), a Fase 5 (Linha do Tempo, Relógios Narrativos, Family Tree, Mystery Board), a Fase 4 (Music/SFX Board e os dois bots do Discord, em `bot/` — veja `bot/README.md`), a Fase 3 (Modo Sessão, Dice Roller, Session Log, Combat Tracker, NPC rápido, Botão do pânico, fila de escrita offline), a Fase 2 (Session Planner, Missões, Tramas, Consequências), a Fase 1 (NPCs, Locais, Facções, Lore, Idea Vault, Tags, Relacionamentos, Busca global, Command Palette) e a Fase 0 (autenticação, campanhas, layout, PWA). Veja [`ARCHITECTURE.md`](./ARCHITECTURE.md) para as decisões técnicas e o roadmap completo por fases.

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

## Deploy (Vercel)

O projeto está conectado à Vercel, com deploy automático a cada push na branch `claude/admiring-euler-h4uduo` (produção). Setup usado:

- **Banco**: Neon (Postgres serverless), conectado via Storage do projeto na Vercel — injeta `DATABASE_URL` automaticamente. Free tier, sem cartão de crédito.
- **Storage de arquivos**: Vercel Blob, acesso **Public** (necessário — o app usa as URLs diretamente em `<img>`/`<audio>`, sem token de leitura). Injeta `BLOB_READ_WRITE_TOKEN`.
- **Variáveis manuais**: `AUTH_SECRET` (gerado com `openssl rand -base64 32`) e `STORAGE_PROVIDER=vercel-blob`.
- **Migrações**: `pnpm build` roda `prisma migrate deploy` antes do `next build` — todo deploy aplica migrações pendentes automaticamente, sem passo manual.

Tudo isso roda no plano **Hobby** (gratuito) da Vercel.

## Estrutura

Veja [`ARCHITECTURE.md`](./ARCHITECTURE.md) para a estrutura de pastas, o modelo de dados, estratégias de autenticação/permissões/sincronização e o roadmap de fases.
