# RPG Master Hub

O sistema operacional para Mestres de RPG organizarem, prepararem e narrarem campanhas que duram meses ou anos.

Este repositório está na **Fase 8 — Copiloto sem LLM**: Lore Guardian (nomes duplicados/parecidos e relacionamentos potencialmente contraditórios), Canon Checker (status canônico cruzado entre entidades relacionadas — uma entidade `CANON` ligada a algo `OBSOLETE`/`ARCHIVED`, ou uma Missão/Trama ativa referenciando conteúdo desatualizado), Campaign Recall (recapitulação cronológica das últimas N sessões, montada por template sobre Cenas jogadas/Session Log/Timeline/Consequências que o mestre já registrou) e Consequence Suggester (gerador combinatório com 120 templates Mad-Libs em 6 categorias, sorteando e preenchendo `{{NPC}}`/`{{FACCAO}}`/`{{LOCAL}}`/`{{ITEM}}` com entidades reais da campanha). O roadmap original chamava esta fase de "IA" com LLM de verdade; por restrição de orçamento do usuário, o pivô foi para geração processual 100% local e sem custo — **zero chamada de rede a qualquer API de LLM**, paga ou de tier grátis (ver `ARCHITECTURE.md`, seção 19.0). Construída sobre a Fase 7 (Campaign Brain avançado, Context Engine, Campaign Health, Content Graveyard), a Fase 6 (Monster/Boss/Item Forge, Power Builder, Table Builder, Loot Generator), a Fase 5 (Linha do Tempo, Relógios Narrativos, Family Tree, Mystery Board), a Fase 4 (Music/SFX Board e os dois bots do Discord, em `bot/` — veja `bot/README.md`), a Fase 3 (Modo Sessão, Dice Roller, Session Log, Combat Tracker, NPC rápido, Botão do pânico, fila de escrita offline), a Fase 2 (Session Planner, Missões, Tramas, Consequências), a Fase 1 (NPCs, Locais, Facções, Lore, Idea Vault, Tags, Relacionamentos, Busca global, Command Palette) e a Fase 0 (autenticação, campanhas, layout, PWA). Veja [`ARCHITECTURE.md`](./ARCHITECTURE.md) para as decisões técnicas e o roadmap completo por fases.

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
