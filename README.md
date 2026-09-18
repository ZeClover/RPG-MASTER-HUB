# RPG Master Hub

O sistema operacional para Mestres de RPG organizarem, prepararem e narrarem campanhas que duram meses ou anos.

Este repositório concluiu a **Fase 13 — Construtor de Sistema**: Atributos, Recursos, Perícias, Condições e Fórmulas de rolagem (avaliador seguro, sem `eval()`) definidos pelo mestre, mais um Modelo de Ficha por campanha com campos secretos e uma ferramenta "Testar fórmula" — leitura aberta a todo jogador, edição só do mestre; esta fase ainda não liga nada disso a `Character` (fica para a Fase 14). Construída sobre a Fase 12 (export/import de campanha em zip com remapeamento total de ID — importar sempre cria uma campanha nova, nunca sobrescreve —, backup automático diário via Vercel Cron + Blob, recuperação de senha com desenho anti-enumeração, e a primeira suíte de testes automatizados/Vitest + CI do projeto), a Fase 11 (Dashboard orientado a módulo, busca global estendida e corrigida contra vazamento de visibilidade), a Fase 10 (Configurações → Módulos, Personagens, Categorias Personalizadas), a Fase 9 (convite/gestão de Co-Mestres e Jogadores, Player View, Player Knowledge, Handouts), a Fase 8 (Lore Guardian, Canon Checker, Campaign Recall, Consequence Suggester — geração processual 100% local, zero LLM, ver `ARCHITECTURE.md` seção 19.0), a Fase 7 (Campaign Brain avançado, Context Engine, Campaign Health, Content Graveyard), a Fase 6 (Monster/Boss/Item Forge, Power Builder, Table Builder, Loot Generator), a Fase 5 (Linha do Tempo, Relógios Narrativos, Family Tree, Mystery Board), a Fase 4 (Music/SFX Board e os dois bots do Discord, em `bot/` — veja `bot/README.md`), a Fase 3 (Modo Sessão, Dice Roller, Session Log, Combat Tracker, NPC rápido, Botão do pânico, fila de escrita offline), a Fase 2 (Session Planner, Missões, Tramas, Consequências), a Fase 1 (NPCs, Locais, Facções, Lore, Idea Vault, Tags, Relacionamentos, Busca global, Command Palette) e a Fase 0 (autenticação, campanhas, layout, PWA). Veja [`ARCHITECTURE.md`](./ARCHITECTURE.md) para as decisões técnicas e o roadmap completo por fases.

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
| `pnpm test` | testes automatizados (Vitest — unitários + integração contra o Postgres local) |
| `pnpm db:migrate` | aplica migrações do Prisma (`prisma migrate dev`) |
| `pnpm db:studio` | abre o Prisma Studio |

## Testes

`pnpm test` roda a suíte Vitest (ver `ARCHITECTURE.md`, seção 23.4): testes unitários de funções puras (`src/lib/dice.test.ts`, `src/lib/roles.test.ts`, `src/modules/core/permissions/visibility.test.ts`) e testes de integração que escrevem de verdade no Postgres apontado por `DATABASE_URL` (round-trip de export/import de campanha, fluxo completo de recuperação de senha, gate de autenticação do cron de backup). Não precisa de nenhuma env var extra além de `DATABASE_URL`/`AUTH_SECRET` já configuradas em `.env` — os testes de integração mockam `@vercel/blob` e o envio de e-mail cai automaticamente no fallback de log (ver abaixo). CI (`.github/workflows/ci.yml`) roda a mesma suíte em todo push/PR contra um `postgres:16` de serviço; a suíte Playwright de e2e (fora deste repositório de testes automatizados) ainda não roda em CI, fica para uma fase futura.

## Storage de imagens

Em desenvolvimento, uploads (ícone/banner/imagem de campanha, e agora faixas de áudio) são gravados em `public/uploads` (git-ignorado). Em produção, defina `STORAGE_PROVIDER=vercel-blob` e `BLOB_READ_WRITE_TOKEN` para usar o Vercel Blob — a troca de provider não exige mudança de código, veja `src/lib/storage`.

## Recuperação de senha

O fluxo "Esqueci minha senha" (`/forgot-password` → `/reset-password`) funciona sem nenhuma configuração extra: sem `RESEND_API_KEY`, o link de redefinição é gravado no log do servidor (`console.log`, visível no terminal do `pnpm dev`/nos Function Logs da Vercel) em vez de ser enviado por e-mail de verdade — suficiente para desenvolver e testar o fluxo ponta a ponta. Para o e-mail chegar de fato na caixa de entrada de quem pediu, crie uma conta grátis em [resend.com](https://resend.com), gere uma API key e configure `RESEND_API_KEY` (e opcionalmente `EMAIL_FROM`, um remetente verificado no Resend). Ver `ARCHITECTURE.md`, seção 23.3, para o desenho de segurança (anti-enumeração, token de uso único).

## Bots do Discord (Music/SFX Board)

O Music/SFX Board (`/campaigns/[campaignId]/audio`) precisa dos dois bots do Discord rodando para tocar música/efeitos de verdade — eles são um projeto Node separado em `bot/`, não fazem parte deste app. Veja [`bot/README.md`](./bot/README.md) para configuração e execução; só é preciso rodá-los durante a sessão, não 24/7.

## Deploy (Vercel)

O projeto está conectado à Vercel, com deploy automático a cada push na branch `claude/admiring-euler-h4uduo` (produção). Setup usado:

- **Banco**: Neon (Postgres serverless), conectado via Storage do projeto na Vercel — injeta `DATABASE_URL` automaticamente. Free tier, sem cartão de crédito.
- **Storage de arquivos**: Vercel Blob, acesso **Public** (necessário — o app usa as URLs diretamente em `<img>`/`<audio>`, sem token de leitura). Injeta `BLOB_READ_WRITE_TOKEN`.
- **Variáveis manuais**: `AUTH_SECRET` (gerado com `openssl rand -base64 32`) e `STORAGE_PROVIDER=vercel-blob`.
- **Migrações**: `pnpm build` roda `prisma migrate deploy` antes do `next build` — todo deploy aplica migrações pendentes automaticamente, sem passo manual.
- **Backup automático** (Fase 12): configure `CRON_SECRET` (gerado com `openssl rand -base64 32`) como env var do projeto — sem ela, o Cron Job diário de `vercel.json` recusa rodar (fail closed) e o resto do hub funciona normalmente, só o backup automático fica inativo (o backup manual em Configurações → Dados não depende disto).
- **Recuperação de senha por e-mail** (Fase 12, opcional): sem `RESEND_API_KEY`, o link de redefinição só é gravado nos Function Logs da Vercel em vez de enviado por e-mail de verdade — funciona, mas exige que quem administra o hub vá buscar o link manualmente para quem pediu. Configure `RESEND_API_KEY` (e opcionalmente `EMAIL_FROM`) para o e-mail chegar sozinho — ver "Recuperação de senha" acima.

Tudo isso roda no plano **Hobby** (gratuito) da Vercel.

## Estrutura

Veja [`ARCHITECTURE.md`](./ARCHITECTURE.md) para a estrutura de pastas, o modelo de dados, estratégias de autenticação/permissões/sincronização e o roadmap de fases.
