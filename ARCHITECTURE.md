# Arquitetura — RPG Master Hub

Este documento registra as decisões técnicas da Fase 0 e o roadmap de fases. Antes de iniciar qualquer fase nova, leia este arquivo e o `README.md`.

## 1. Arquitetura

Aplicação **única** Next.js (App Router), não um monorepo. O motivo: os bots do Discord (Fase 4) precisam de um processo Node persistente, mas não existe código de bot ainda — criar um monorepo agora só para acomodar algo que não existe adicionaria complexidade sem benefício (ver "Bots" abaixo).

Dentro do app, o código se organiza em duas dimensões:

- **`app/`** — apenas rotas. Layouts e páginas são finos: buscam sessão/dados via `modules/`, e delegam toda a lógica de domínio.
- **`modules/<domínio>/<entidade>/`** — a lógica de negócio de verdade: `schemas.ts` (Zod), `actions.ts` (Server Actions), `queries.ts` (leituras). Mapeia diretamente para os domínios do briefing (CORE, CREATION, STORY, GAME, MEDIA, AUDIO, INTELLIGENCE, PLAYER).

Só existe o módulo `core` por enquanto (`auth`, `campaigns`, `permissions`). Os demais domínios serão criados quando suas fases começarem — pastas vazias "reservando o nome" não têm valor.

## 2. Stack

- **Next.js 16** (App Router, Turbopack, React 19) — hospedagem-alvo Vercel.
- **TypeScript** em todo o projeto.
- **Tailwind CSS 4** (config em CSS, `src/app/globals.css`) — tokens de design como variáveis CSS, dark mode como único tema por padrão.
- **Prisma 7 + PostgreSQL** — ORM e banco relacional. Prisma 7 mudou a arquitetura do cliente gerado (ver seção 4).
- **Auth.js v5** (`next-auth@beta`) com Credentials (bcrypt) + Prisma Adapter.
- **Zod** para validação (compartilhada entre formulário e Server Action).
- **React Hook Form** não é usado ainda — os formulários da Fase 0 usam `useActionState` + `<form action>` nativo, que já cobre validação/erro/pending sem biblioteca extra. Será avaliado quando formulários mais complexos (wizards, campos dinâmicos) aparecerem nas próximas fases.
- **Zustand** — estado de UI leve (hoje, só o indicador de sincronização).
- **TanStack Query** — provider já instalado para cache de dados no cliente; ainda pouco usado na Fase 0 (a maioria das leituras acontece em Server Components).
- **Radix UI + CVA + tailwind-merge** — primitivas acessíveis (`src/components/ui`) no estilo shadcn, mas mantidas no projeto (não geradas via CLI) para controle total.

### Por que não `@ducanh2912/next-pwa`

Avaliado e descartado: é um plugin **webpack**, e o Next.js 16 usa Turbopack por padrão em dev *e* build — um `next build` com config webpack customizada falha de propósito para evitar erro silencioso. Em vez disso, o PWA usa só convenções nativas do App Router (`app/manifest.ts`) e um `public/sw.js` escrito à mão — nenhuma dependência, zero conflito com Turbopack.

## 3. Estrutura de pastas

```
prisma/
  schema.prisma
src/
  app/
    (auth)/login, (auth)/register        — layout compartilhado, sem sidebar
    home/                                 — lista de campanhas do usuário
    campaigns/new/                        — criação de campanha
    campaigns/[campaignId]/               — layout com guarda de acesso + shell
      dashboard/
      settings/
    api/
      auth/[...nextauth]/                 — handlers do Auth.js
      v1/uploads/                         — upload de imagens (autenticado)
    manifest.ts, offline/
  modules/
    core/
      auth/        — schemas, actions (register/login/logout), sessão
      campaigns/   — schemas, actions, queries
      permissions/ — requireCampaignAccess (único ponto de checagem de papel)
  components/
    ui/            — primitivas (Button, Card, Dialog, DropdownMenu, Tooltip, Avatar...)
    layout/        — topbar, sidebar de campanha, menu de usuário
    campaigns/     — formulário de campanha, upload de imagem, card
    providers/     — QueryProvider, ConnectivityListener, ServiceWorkerRegister
  lib/
    db.ts          — client Prisma singleton
    auth.ts        — config do Auth.js
    storage/       — abstração de upload (local | Vercel Blob)
    sync-store.ts  — estado de sincronização (Zustand)
    format.ts, utils.ts
  types/           — augmentations (next-auth) e tipos compartilhados
  proxy.ts         — Next 16 renomeou `middleware.ts` → `proxy.ts`; usado para guarda otimista de rotas
```

## 4. Modelo de dados (Fase 0)

```
User            — id, name, email, passwordHash, image, timestamps
Account/Session/VerificationToken — tabelas padrão do Auth.js (deixam pronto login social, ex. Discord)
Campaign        — nome, descrição, imagem/banner/ícone/símbolo/background,
                  cor primária/secundária, status (ACTIVE/ARCHIVED), última/próxima sessão
CampaignMember  — (campaignId, userId, role) — role: OWNER | CO_GM | PLAYER
```

`CampaignMember` já modela multi-usuário mesmo sem UI de convite: hoje só existe o papel `OWNER` (criado automaticamente ao criar a campanha), mas o enum e a tabela de associação já suportam `CO_GM`/`PLAYER` para a Fase 9.

### Nota sobre Prisma 7

O gerador mudou de `prisma-client-js` para `prisma-client`: o client gerado vai para `src/generated/prisma` (git-ignorado, gerado no `postinstall`) em vez de dentro de `node_modules`, é ESM e **não lê mais `DATABASE_URL` implicitamente em runtime** — o `PrismaClient` exige um driver adapter explícito. Por isso `src/lib/db.ts` usa `@prisma/adapter-pg` (`new PrismaPg(connectionString)`) para o client de runtime; o `prisma7.config.ts` (usado pela CLI para migrations/introspection) é configurado separadamente e aponta para a mesma `DATABASE_URL`.

## 5. Autenticação

Auth.js v5, Credentials provider (email + senha, hash bcrypt), sessão **JWT** (obrigatório quando há Credentials provider — sessão em banco não é suportada nesse caso). Prisma Adapter conectado desde já, então adicionar um provider OAuth (ex. "Entrar com Discord", plausível dado que o Discord já faz parte do produto) no futuro é só configuração, sem migração de dados.

Registro e login usam Server Actions com `useActionState` — sem JS no cliente além do necessário para mostrar erro/pending, seguindo o padrão recomendado pela própria documentação do Next.js 16 para auth.

`src/proxy.ts` faz a checagem **otimista** (lê o JWT do cookie, redireciona `/home` e `/campaigns/*` não autenticados para `/login`). Isso não substitui a checagem "de verdade": toda page, Server Action e Route Handler que lida com dado de campanha chama `requireCampaignAccess`/`requireUser` de novo — a Vercel/Next recomenda não confiar só na camada de proxy porque ela roda antes do React re-renderizar em navegações client-side.

## 6. Storage

Interface única (`StorageProvider`: `upload`/`delete`) com dois back-ends reais:

- **local** (dev): grava em `public/uploads`, retorna caminho relativo.
- **vercel-blob** (produção): usa `@vercel/blob`, retorna URL absoluta.

A escolha é por `STORAGE_PROVIDER` (env var), com fallback automático para `vercel-blob` quando `process.env.VERCEL` existe. O endpoint `/api/v1/uploads` é o único ponto de entrada — autentica o usuário, valida tipo/tamanho, e (quando há `campaignId`) confirma papel `OWNER` antes de gravar sob `campaigns/<id>/...`. Os campos de imagem no schema de campanha aceitam tanto URL absoluta quanto caminho relativo (não usar `z.url()` estrito aqui — é exatamente esse descompasso entre os dois providers).

## 7. PWA

`app/manifest.ts` (convenção nativa do App Router) + `public/sw.js` escrito à mão: cacheia uma página `/offline` no install, e no evento `fetch` só intercepta navegações (`request.mode === "navigate"`), tentando rede primeiro e caindo para `/offline` se falhar. Instalável em desktop/Android/iOS. Cache agressivo de dados de campanha para uso offline real é da Fase 3 (Modo Sessão) — a Fase 0 só entrega a fundação (manifest + SW + fallback), não decisões de cache por entidade que ainda não existem.

## 8. Sincronização

Os dados nunca ficam presos ao dispositivo: tudo passa pelo Postgres via Server Actions/API, não por `localStorage`. `useSyncStore` (Zustand) guarda um status (`synced | saving | pending | offline | error`) exibido na topbar; hoje é alimentado apenas por `navigator.onLine` — fila de escrita offline e resolução de conflito (dispositivo A/B editando a mesma campanha) chegam com o Modo Sessão (Fase 3), que é onde a sincronização realmente importa. Não fingimos um status "salvo" que não reflete nada real.

## 9. Permissões

Um único helper, `requireCampaignAccess(userId, campaignId, minRole?)`, usado por toda action/rota que toca dado de campanha. Hoje só `OWNER` existe de fato (criado automaticamente na criação da campanha), mas o enum `CampaignRole` (`OWNER`/`CO_GM`/`PLAYER`) e o ranking de acesso já estão prontos para a Fase 9 (convites, co-mestres, jogadores). Visibilidade por conteúdo (Somente Mestre / Jogadores / Público) é um campo a adicionar nas entidades de conteúdo quando elas existirem (Fase 1+) — não faz sentido no Core ainda, já que não há conteúdo compartilhável.

## 10. Bots do Discord (preparação, não implementação)

Nenhum código de bot nesta fase (é item de Fase 4). Arquitetura prevista: um processo Node separado e persistente (fora da Vercel — funções serverless não sustentam conexão de voz), rodando `discord.js`, autenticado contra a API do hub via um secret de serviço (rota futura `/api/v1/bot/*`, nunca via sessão de usuário). O token do Discord nunca passa perto do frontend.

## 11. Decisões-chave desta fase

- Nenhum botão decorativo: itens de navegação de fases futuras (Criação, Preparação, Sessão, Jogo, Mídia, Ferramentas, Sistema) aparecem desabilitados com tooltip "Em breve — Fase X", nunca como link morto.
- Upload de imagem é upload de verdade (grava arquivo, persiste URL), não um campo de texto fingindo ser upload.
- Arquivar campanha pede confirmação (é reversível, mas ainda é uma ação que tira a campanha da visão principal do usuário).

## 12. Roadmap de fases

| Fase | Escopo |
| --- | --- |
| **0 — Fundação** ✅ | auth, campanhas, layout, PWA base, storage, sync base, permissões base |
| 1 — Wiki da campanha | NPCs, Locais, Facções, Lore, Tags, Relacionamentos, Busca global, Idea Vault, Brainstorm básico |
| 2 — Preparação | Session Planner, Checklist, Scene Builder, Quests, Consequências, Plot Threads |
| 3 — Modo Sessão | Modo Sessão, Dice Roller, Session Log, Combat Tracker, Quick NPC, Panic Button — offline real prioritário aqui |
| 4 — Áudio | Music/SFX Board, Presets, os dois bots do Discord |
| 5 — World Building | Timeline, Calendário, Relógios Narrativos, Family Tree, Mystery Board |
| 6 — Game Tools | Monster/Boss/Item Forge, Power Builder, Loot Generator, Table Builder |
| 7 — Inteligência da campanha | Campaign Brain avançado, Context Engine, Campaign Health, Content Graveyard |
| 8 — IA | Lore Guardian, Canon Checker, Campaign Recall, Consequence Suggester (sempre copiloto, nunca autoridade) |
| 9 — Jogadores | Player View, Player Knowledge, Handouts, Co-Mestres, permissões avançadas |

Cada fase começa lendo o código existente, reaproveitando `modules/core` e os componentes de `components/ui`, sem reescrever o que já funciona.
