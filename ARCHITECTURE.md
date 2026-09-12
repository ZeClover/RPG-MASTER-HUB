# Arquitetura — RPG Master Hub

Este documento registra as decisões técnicas da Fase 0 e o roadmap de fases. Antes de iniciar qualquer fase nova, leia este arquivo e o `README.md`.

## 1. Arquitetura

O app Next.js (App Router) continua uma aplicação única — não um monorepo. Os dois bots do Discord (Fase 4) é que vivem fora dele: `bot/` é um projeto Node separado, com seu próprio `package.json`/`node_modules`, porque precisam de um processo persistente com conexão de voz, algo que a Vercel (funções serverless) não sustenta (ver seção 15.4).

Dentro do app, o código se organiza em duas dimensões:

- **`app/`** — apenas rotas. Layouts e páginas são finos: buscam sessão/dados via `modules/`, e delegam toda a lógica de domínio.
- **`modules/<domínio>/<entidade>/`** — a lógica de negócio de verdade: `schemas.ts` (Zod), `actions.ts` (Server Actions), `queries.ts` (leituras). Mapeia diretamente para os domínios do briefing (CORE, CREATION, STORY, GAME, MEDIA, AUDIO, INTELLIGENCE, PLAYER).

Até a Fase 0 só existia o módulo `core` (`auth`, `campaigns`, `permissions`). A Fase 1 introduziu o domínio `creation`: `modules/creation/<entidade>/` para cada tipo de conteúdo (NPCs, Locais, Facções, Lore, Ideias) mais dois módulos transversais que várias entidades compartilham (`tags`, `relationships`). A Fase 2 introduziu o domínio `preparation` (Sessões, Missões, Tramas, Consequências). A Fase 4 introduziu o domínio `audio` (Music/SFX Board — `modules/audio/`), mapeando para o domínio AUDIO do briefing. A Fase 5 introduziu o domínio `worldbuilding` (Timeline, Calendário, Relógios Narrativos, Family Tree, Mystery Board — `modules/worldbuilding/<entidade>/`), mapeando para o domínio STORY/World Building do briefing. A Fase 6 introduziu o domínio `gametools` (Monster/Item/Power Forge, Table Builder, Loot Generator — `modules/gametools/<entidade>/`), mapeando para o domínio GAME avançado do briefing. A Fase 7 introduziu o domínio `intelligence` (Campaign Brain avançado, Context Engine, Campaign Health, Content Graveyard — `modules/intelligence/<entidade>/`), mapeando para o domínio INTELLIGENCE do briefing — 100% agregação/heurística sobre dados já existentes, zero chamada de IA (ver seção 18.0). O domínio ainda não usado (PLAYER) continua sem pasta — mesma regra da Fase 0, pastas vazias não têm valor.

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
      dashboard/                          — Fase 1: contadores reais, recentes, favoritos, ações rápidas
      settings/
      npcs/, locations/, factions/, lore/  — list/new/[id]/[id]/edit (CRUD completo, Fase 1)
      ideas/                               — página única de captura rápida (Fase 1)
      tags/                                — gestão de tags da campanha (Fase 1)
      search/                              — busca global em texto (Fase 1)
      session-plans/                       — list/new/[id] (Cenas+Checklist inline)/[id]/edit (Fase 2)
      quests/, plot-threads/, consequences/ — list/new/[id]/[id]/edit (CRUD completo, Fase 2)
      session/                             — Modo Sessão: dados, registro, combate (Fase 3, offline real)
      audio/                                — Music/SFX Board (Fase 4)
      timeline/, clocks/, family-tree/, mysteries/ — World Building (Fase 5, Calendário embutido na Timeline)
      monsters/, items/, powers/            — Forge + Power Builder (Fase 6)
      tables/, loot/                        — Table Builder e Loot Generator (Fase 6, mesmo modelo RollTable
                                               com kind GENERIC/LOOT — seção 17.3)
      brain/, context/, health/, graveyard/ — Inteligência da campanha (Fase 7): Campaign Brain avançado,
                                               Context Engine (context/[type]/[id]), Campaign Health,
                                               Content Graveyard — ver seção 18
    api/
      auth/[...nextauth]/                 — handlers do Auth.js
      v1/uploads/                         — upload de imagens e áudio (autenticado, mínimo CO_GM — seção 15.11)
      v1/bot/music/, v1/bot/sfx/, v1/bot/sfx/ack/ — lidas pelos bots do Discord, autenticadas por secret (Fase 4)
    manifest.ts, offline/
  modules/
    core/
      auth/        — schemas, actions (register/login/logout), sessão
      campaigns/   — schemas, actions, queries
      permissions/ — requireCampaignAccess (único ponto de checagem de papel)
      search/      — busca global (Fase 1, estendida na Fase 2): queries cross-entidade + action
      dashboard/   — queries agregadas do dashboard (Fase 1, estendida na Fase 2)
    creation/
      npcs/, locations/, factions/, lore/, ideas/  — schemas, actions, queries de cada entidade (Fase 1)
      tags/          — slug/dedup, actions, queries (Fase 1)
      relationships/ — associação polimórfica entre entidades (Fase 1, ver seção 12.1; estendida na Fase 2
                       para incluir Quest/PlotThread/Consequence — ver seção 13.1)
      wiki-filters.ts — tipo genérico `WikiListFilters<TStatus>` compartilhado (q/tag/status/favorite/archived)
    preparation/
      session-plans/ — schemas, actions (SessionPlan + `scene-actions.ts` + `checklist-actions.ts`), queries (Fase 2)
      quests/, plot-threads/, consequences/ — schemas, actions, queries de cada entidade (Fase 2)
    game/
      session-log/ — schemas, actions (upsert idempotente por clientId), queries (Fase 3)
      combat/      — schemas, actions (encontro + combatentes), queries (Fase 3)
    audio/
      schemas.ts, actions.ts, queries.ts — faixas, estado de reprodução de música, eventos de SFX, vínculo Discord (Fase 4)
    worldbuilding/
      timeline/  — schemas, actions (com reordenação), queries de TimelineEvent (Fase 5)
      calendar/  — schemas, actions (upsert), queries de CampaignCalendar — singleton por campanha (Fase 5)
      clocks/    — schemas, actions (incrementar/decrementar), queries de NarrativeClock (Fase 5)
      family-tree/ — schemas, actions de FamilyRelation, `tree.ts` (função pura que monta a árvore — Fase 5)
      mysteries/ — schemas, actions (Mystery + `clue-actions.ts`), queries de Mystery/Clue (Fase 5)
    gametools/
      monsters/  — schemas, actions (Monster + `attribute-actions.ts`), queries de Monster/MonsterAttribute (Fase 6)
      items/     — schemas, actions, queries de Item (Fase 6)
      powers/    — schemas, actions, queries de Power (Fase 6)
      roll-tables/ — schemas, `roll.ts` (sorteio ponderado puro), `roll-actions.ts`, actions (RollTable +
                     `entry-actions.ts`), queries — motor único por trás de Table Builder e Loot Generator,
                     diferenciados só por `RollTableKind` (Fase 6, ver seção 17.3)
    intelligence/
      content-types.ts — `ContentEntityType` e mapas de label/ícone/rota compartilhados pelas 4 sub-features
                          (mais amplo que `RelatableEntityType` — seção 18.6)
      brain/           — queries (feed unificado + distribuição canônico/rascunho, Fase 7, seção 18.1)
      context-engine/  — queries (`getEntityContext`, raio-x de uma entidade relacionável, seção 18.2)
      health/          — queries (6 heurísticas de diagnóstico, sem pontuação numérica, seção 18.3)
      graveyard/       — queries (agrega `archived: true` de todos os tipos) + actions (despachante fino
                         sobre `toggle*ArchivedAction`/`delete*Action` já existentes, seção 18.4)
  components/
    ui/            — primitivas (Button, Card, Dialog, DropdownMenu, Tooltip, Avatar, Select, Popover...)
    layout/        — topbar, sidebar de campanha, menu de usuário
    campaigns/     — formulário de campanha, upload de imagem, card
    providers/     — QueryProvider, ConnectivityListener, ServiceWorkerRegister
    wiki/          — componentes reaproveitados por toda entidade de conteúdo (Fase 1, generalizado na Fase 2
                     para não depender de `CanonStatus` — ver seção 13.4): tag picker, card/grid genéricos,
                     painel de relacionamentos, command palette, markdown viewer
    npcs/, locations/, factions/, lore/, ideas/ — formulários e widgets específicos de cada entidade (Fase 1)
    quests/, plot-threads/, consequences/       — formulários específicos de cada entidade (Fase 2)
    session-plans/  — formulário de sessão, lista de cenas (com reordenação), checklist inline (Fase 2)
    session-mode/   — painéis do Modo Sessão: registro, combate, dados, NPC rápido, botão do pânico,
                      e `use-offline-sync.ts` (a ponte com a fila de escrita offline) (Fase 3)
    audio/          — formulário de faixa, board de música/efeitos, formulário de vínculo do Discord (Fase 4)
    timeline/       — formulário de evento, lista cronológica com reordenação, widget de calendário (Fase 5)
    clocks/         — formulário de relógio, card com face em `conic-gradient` e incrementar/decrementar (Fase 5)
    family-tree/    — painel "Família" (NPC), seletor de NPC, diálogo de novo parentesco, árvore recursiva (Fase 5)
    mysteries/      — formulário de mistério, lista de pistas com vínculo opcional a entidade (Fase 5)
    monsters/       — formulário de monstro, lista de atributos livres chave/valor (Fase 6)
    items/          — formulário de item (Fase 6)
    powers/         — formulário de poder (Fase 6)
    roll-tables/    — formulário de tabela, lista de entradas (peso/chance), roller com botão "Rolar" e
                      registro opcional no Session Log (Fase 6, reaproveitado por Table Builder e Loot Generator)
    intelligence/   — feed de atividade unificado, gráfico de distribuição canônico/rascunho, seletor de
                      entidade do Context Engine, painel de pistas que citam a entidade, seções de
                      diagnóstico do Campaign Health, linha de item do Content Graveyard (Fase 7)
  lib/
    db.ts          — client Prisma singleton
    auth.ts        — config do Auth.js
    storage/       — abstração de upload (local | Vercel Blob)
    sync-store.ts  — estado de sincronização (Zustand), estendido na Fase 3 com contagem de escritas pendentes
    dice.ts         — parser/roller de notação de dados, puro (Fase 3)
    offline-queue.ts — fila de escrita offline em IndexedDB (Fase 3, ver seção 14.1)
    bot-auth.ts      — autenticação por secret compartilhado + resolução de URL de arquivo para os bots (Fase 4)
    format.ts, utils.ts
  types/           — augmentations (next-auth) e tipos compartilhados
  proxy.ts         — Next 16 renomeou `middleware.ts` → `proxy.ts`; usado para guarda otimista de rotas
bot/               — projeto Node separado (não faz parte do build do Next.js): os dois bots do Discord,
                     seu próprio package.json/node_modules — ver seção 15.4 e bot/README.md
```

## 4. Modelo de dados (Fase 0)

```
User            — id, name, email, passwordHash, image, timestamps
Account/Session/VerificationToken — tabelas padrão do Auth.js (deixam pronto login social, ex. Discord)
Campaign        — nome, descrição, imagem/banner/ícone/símbolo/background,
                  cor primária/secundária, status (ACTIVE/ARCHIVED), última/próxima sessão
CampaignMember  — (campaignId, userId, role) — role: OWNER | CO_GM | PLAYER
```

`CampaignMember` já modela multi-usuário mesmo sem UI de convite: a criação de campanha só atribui o papel `OWNER` (automaticamente, ao dono). O enum `CampaignRole` (`OWNER`/`CO_GM`/`PLAYER`) e o ranking de acesso em `requireCampaignAccess` já são usados de verdade desde a Fase 1 — toda criação/edição/exclusão de conteúdo (NPCs, Locais, Facções, Lore, Ideias, Tags, Relacionamentos) exige `CO_GM` como papel mínimo, mesmo sem existir ainda uma tela para promover alguém a `CO_GM`/`PLAYER` (isso é a UI de convite da Fase 9) — os testes de permissão inserem a membership direto no banco para validar a regra hoje.

### Nota sobre Prisma 7

O gerador mudou de `prisma-client-js` para `prisma-client`: o client gerado vai para `src/generated/prisma` (git-ignorado, gerado no `postinstall`) em vez de dentro de `node_modules`, é ESM e **não lê mais `DATABASE_URL` implicitamente em runtime** — o `PrismaClient` exige um driver adapter explícito. Por isso `src/lib/db.ts` usa `@prisma/adapter-pg` (`new PrismaPg(connectionString)`) para o client de runtime; o `prisma7.config.ts` (usado pela CLI para migrations/introspection) é configurado separadamente e aponta para a mesma `DATABASE_URL`.

### Modelo de dados (Fase 1)

```
Npc, Location, Faction, LorePage   — entidades de conteúdo. Campos comuns: campaignId, nome/título,
                                      canonStatus (DRAFT|PROPOSED|APPROVED|CANON|OBSOLETE|ARCHIVED),
                                      archived, favorite, visibility (GM_ONLY|PLAYERS|PUBLIC), timestamps
Location.parentLocationId          — auto-relação (hierarquia), onDelete: Restrict (seção 12.4)
Idea                                — captura rápida; só título é obrigatório; sem canonStatus/visibility
                                      (é pré-canônico por natureza — ver 12.2)
Tag, NpcTag, LocationTag,
FactionTag, LorePageTag, IdeaTag   — tag por campanha (slug único) + 5 junções 1:1 por tipo (seção 12.3)
Relationship                       — sourceType/sourceId + targetType/targetId (RelatableEntityType:
                                      NPC|LOCATION|FACTION|LORE_PAGE|QUEST|PLOT_THREAD|CONSEQUENCE, os
                                      três últimos chegaram na Fase 2) + type/description/importance/
                                      visibility; sem FK de banco (associação polimórfica, seção 12.1)
```

### Modelo de dados (Fase 2)

```
SessionPlan   — título, sessionNumber, plannedDate, pitch, gmNotes, status (PLANNING|READY|DONE|
                CANCELLED), favorite, archived. Sem canonStatus/visibility (é material de preparação
                do mestre, não conteúdo compartilhável da wiki — ver seção 13.5)
Scene         — filho direto de SessionPlan (FK real, não polimórfica — ver 13.2), com title/summary/
                readAloud/goal/order/status (PLANNED|PLAYED|CUT) e favorite; sem página própria, sempre
                editado inline na página da sessão
ChecklistItem — filho direto de SessionPlan (FK real): label/done/order; sem página própria
Quest         — título/description/objective/reward, status (NOT_STARTED|ACTIVE|COMPLETED|FAILED|
                ABANDONED), visibility, favorite, archived, tags — participa do sistema de Relacionamentos
PlotThread    — título/description, status (ACTIVE|DORMANT|RESOLVED|ABANDONED), importance (reaproveita
                RelationshipImportance — ver 13.3), visibility, favorite, archived, tags — idem
Consequence   — título/trigger/description, status (PENDING|TRIGGERED|RESOLVED), visibility, favorite,
                archived, tags — idem
QuestTag, PlotThreadTag, ConsequenceTag — 3 novas junções 1:1 com Tag, mesmo padrão da Fase 1
```

### Modelo de dados (Fase 3)

```
SessionLogEntry  — campaignId, sessionPlanId opcional, type (NOTE|DICE_ROLL|COMBAT_EVENT), content,
                   clientId opcional (gerado no navegador; @@unique([campaignId, clientId]) faz o
                   reenvio da fila offline ser um upsert idempotente — ver seção 14.1)
CombatEncounter  — campaignId, sessionPlanId opcional, name, round, activeCombatantId, endedAt
                   (null = combate em andamento; “o encontro atual” é o mais recente com endedAt null)
Combatant        — filho direto de CombatEncounter (FK real): name, type (PC|NPC), initiative,
                   hpCurrent/hpMax, conditions, order. O id é gerado no CLIENTE (não pelo banco) pelo
                   mesmo motivo do `clientId` acima — ver seção 14.1
```

### Modelo de dados (Fase 4)

```
AudioTrack          — campaignId, name, category (MUSIC|SFX), fileUrl, loop (default true) — cada
                       faixa enviada já é o "preset" que aparece no board, sem tabela própria (15.1)
DiscordLink         — campaignId @unique, guildId, voiceChannelId — preenchidos manualmente pelo
                       mestre a partir do Modo Desenvolvedor do Discord, sem OAuth (seção 15.2)
MusicPlaybackState  — campaignId @unique, trackId? (SetNull ao apagar a faixa), isPlaying — estado
                       contínuo de "o que deveria estar tocando agora" (seção 15.3)
SfxTriggerEvent     — campaignId, trackId (Cascade), processedAt? — log append-only de disparos,
                       um por clique em "Tocar"; o bot confirma preenchendo processedAt (seção 15.3)
```

### Modelo de dados (Fase 5)

```
TimelineEvent, TimelineEventTag — evento narrativo: título/descrição, narrativeDate (texto livre, seção
                       16.2), order (Int, reordenável — mesmo padrão de Scene.order), visibility/favorite/
                       archived/tags; participa de Relacionamentos (RelatableEntityType.TIMELINE_EVENT)
CampaignCalendar    — campaignId @unique (singleton, mesmo padrão de DiscordLink/MusicPlaybackState),
                       currentDay Int, dayLabel String — corte de escopo deliberado (seção 16.2)
NarrativeClock      — campaignId, título/descrição, segments Int, filled Int, favorite/archived — sem
                       visibility/tags/Relacionamentos (ferramenta de acompanhamento do mestre, seção 16.2)
FamilyRelationType  — enum PARENT_OF | SPOUSE_OF | SIBLING_OF
FamilyRelation      — campaignId, npcAId/npcBId (FK reais para Npc, Cascade), relationType, notes? — tabela
                       dedicada, não polimórfica (seção 16.3)
Mystery, MysteryTag — título/descrição, status (OPEN|RESOLVED), visibility/favorite/archived/tags;
                       participa de Relacionamentos (RelatableEntityType.MYSTERY)
Clue                — filho direto de Mystery (FK real, Cascade, mesmo padrão de Scene/ChecklistItem):
                       text/discovered/order, linkedEntityType?/linkedEntityId? (ponteiro polimórfico leve,
                       resolvido por resolveEntityRefs — seção 16.4, não uma linha em Relationship)
```

### Modelo de dados (Fase 6)

```
Monster, MonsterTag — monstro/chefe: nome, isBoss Boolean, description, canonStatus/visibility/favorite/
                       archived/tags; participa de Relacionamentos (RelatableEntityType.MONSTER) — seção 17.1
MonsterAttribute    — filho direto de Monster (FK real, Cascade, mesmo padrão de Scene/Clue): key/value/order,
                       lista livre de atributos porque cada sistema de jogo nomeia estatísticas diferente (17.1)
Item, ItemTag       — nome, category (tipo/raridade livre), description, effect, canonStatus/visibility/
                       favorite/archived/tags; participa de Relacionamentos (RelatableEntityType.ITEM)
Power, PowerTag     — nome, cost (texto livre, ex. "2 PM"), description, effect, canonStatus/visibility/
                       favorite/archived/tags; participa de Relacionamentos (RelatableEntityType.POWER) — 17.2
RollTableKind       — enum GENERIC | LOOT
RollTable           — nome/descrição, kind RollTableKind, favorite/archived — sem visibility/tags/
                       Relacionamentos (ferramenta de mesa do mestre, mesmo raciocínio de NarrativeClock — 17.3).
                       Table Builder e Loot Generator são a MESMA tabela, diferenciada só por `kind` (seção 17.3)
RollTableEntry      — filho direto de RollTable (FK real, Cascade): label/weight/order — `weight` substitui uma
                       faixa numérica explícita (ex. "1-3"), o peso já representa o tamanho do intervalo (17.3)
```

### Modelo de dados (Fase 7)

Nenhum modelo novo. As quatro sub-features são queries de leitura (e, no caso do Content Graveyard, um despachante
para actions que já existiam por entidade) sobre os modelos das Fases 1–6 — ver seção 18.0 para a avaliação
explícita de por que nenhuma tabela nova foi necessária, e seção 18.6 para `ContentEntityType`, o único tipo
novo desta fase (TypeScript puro, não um enum de banco).

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

`app/manifest.ts` (convenção nativa do App Router) + `public/sw.js` escrito à mão: cacheia uma página `/offline` no install, e no evento `fetch` intercepta navegações (`request.mode === "navigate"`). Duas estratégias diferentes, deliberadamente: para a maioria das rotas, rede primeiro e `/offline` se falhar (essas páginas são de preparação — usadas antes/depois da mesa, perder conexão nelas só significa recarregar depois). Para `/campaigns/*/session` (Modo Sessão, Fase 3), a estratégia é network-first-com-cache-de-snapshot: tenta a rede, e se falhar serve a ÚLTIMA versão em cache dessa página (não `/offline`) — reabrir a sessão com o estado de quando esteve online pela última vez é mais útil ao mestre no meio da mesa do que uma tela genérica de "sem conexão". Instalável em desktop/Android/iOS. Ver seção 14.1 para a discussão completa do porquê isso (e não um cache agressivo do app inteiro) é o desenho certo.

## 8. Sincronização

Os dados nunca ficam presos ao dispositivo: tudo passa pelo Postgres via Server Actions/API, não por `localStorage`. `useSyncStore` (Zustand) guarda um status (`synced | saving | pending | offline | error`) exibido na topbar, mais (desde a Fase 3) uma contagem de escritas pendentes. Até a Fase 2, era alimentado só por `navigator.onLine`. A Fase 3 (Modo Sessão) implementou a fila de escrita offline e a resolução de conflito prometidas aqui desde a Fase 0 — ver seção 14.1 para o desenho completo (fila em IndexedDB, ids gerados no cliente para reenvio idempotente, e por que "um dispositivo por vez" é a resolução de conflito certa para este produto, não CRDT/OT). Não fingimos um status "salvo" que não reflete nada real.

## 9. Permissões

Um único helper, `requireCampaignAccess(userId, campaignId, minRole?)`, usado por toda action/rota que toca dado de campanha — nunca a UI sozinha decide o que é permitido (seção 12.7 detalha o padrão de exclusão segura que depende disso). Na Fase 0 só o papel `OWNER` existia de fato; a partir da Fase 1 o ranking `OWNER > CO_GM > PLAYER` já é aplicado de verdade: toda criação/edição/exclusão de conteúdo exige `CO_GM` (o padrão do parâmetro `minRole` é `PLAYER`, suficiente para leitura). A UI para promover alguém a `CO_GM`/`PLAYER` (convites) ainda não existe — isso é Fase 9 — mas a checagem de papel já está pronta para quando existir. Visibilidade por conteúdo (`GM_ONLY`/`PLAYERS`/`PUBLIC`) chegou na Fase 1 como campo nas entidades de conteúdo (NPCs, Locais, Facções, Lore); ainda não há um "Player View" (Fase 9) que efetivamente filtre por ela — hoje o campo só é exibido como metadado. A rota `/api/v1/uploads` exige `CO_GM` (não `OWNER`) para upload vinculado a campanha desde a Fase 4 — antes disso, um resquício da Fase 0 exigia `OWNER`, contradizendo o resto do modelo (ver seção 15.11).

## 10. Bots do Discord

Dois processos Node separados (`bot/`, fora da Vercel — funções serverless não sustentam conexão de voz), um para trilha sonora contínua e um para efeitos sonoros avulsos, cada um autenticado como uma aplicação Discord própria (token/ID próprios) e ambos autenticados contra a API do hub via secret de serviço (`/api/v1/bot/*`, nunca via sessão de usuário — seção 15.5). O token do Discord nunca passa perto do frontend. Implementados na Fase 4 — detalhes de desenho em toda a seção 15 e em `bot/README.md`.

## 11. Decisões-chave desta fase

- Nenhum botão decorativo: itens de navegação de fases futuras (Criação, Preparação, Sessão, Jogo, Mídia, Ferramentas, Sistema) aparecem desabilitados com tooltip "Em breve — Fase X", nunca como link morto.
- Upload de imagem é upload de verdade (grava arquivo, persiste URL), não um campo de texto fingindo ser upload.
- Arquivar campanha pede confirmação (é reversível, mas ainda é uma ação que tira a campanha da visão principal do usuário).

## 12. Fase 1 — Decisões técnicas

### 12.1 Relacionamentos — associação polimórfica

O requisito (NPCs, Locais, Facções e páginas de Lore podem se relacionar entre si, em qualquer combinação, com um rótulo livre como "traiu", "governa" ou "está enterrado em") é uma associação **polimórfica**: uma tabela que referencia "uma entidade de um tipo entre vários", algo que o Postgres/Prisma não modela nativamente com FK real (uma FK aponta para uma tabela só).

Opções consideradas:

- **Uma tabela de junção por par de tipos** (`npc_faction_relations`, `npc_location_relations`, ...): FK real e integridade garantida pelo banco, mas o número de tabelas cresce com o quadrado do número de tipos de entidade (hoje 4 tipos → 6 pares; a Fase 5 provavelmente adiciona mais tipos relacionáveis). Também exigiria UI e queries diferentes por combinação, contrariando o requisito de uma única UI de "Relacionamentos" genérica em toda entidade.
- **Uma coluna JSON** guardando a lista de relações na própria entidade: rápido de escrever, mas quebra consulta indexada (não dá para responder "quem referencia este NPC?" sem varrer todas as tabelas) e o requisito explícito é mostrar relações **nos dois lados** (se A → B, abrir B também mostra a relação com A).
- **Discriminador de string + sem FK de banco** (escolhida): uma única tabela `Relationship` com `sourceType/sourceId` e `targetType/targetId` (`RelatableEntityType`: NPC/LOCATION/FACTION/LORE_PAGE), mais `type` (texto livre, ex. "traiu"), `description`, `importance` e `visibility`. Sem FK nativa porque `sourceId`/`targetId` não apontam para uma tabela fixa — é a limitação intrínseca do modelo, não um descuido.

Consequências assumidas por essa escolha, e como cada uma foi endereçada:

- **Integridade referencial fica em nível de aplicação, não de banco.** Ao apagar um NPC/Local/Facção/página de Lore, a action de exclusão roda `db.$transaction([relationship.deleteMany({ where: OR[{sourceType,sourceId},{targetType,targetId}] }), <entidade>.delete(...)])` — a limpeza das relações órfãs é atômica com a exclusão da entidade. Isso é o "cascade" mencionado no requisito de exclusão segura (mas só para relações, nunca para outro conteúdo, conforme exigido).
- **Sem `include` do Prisma para resolver o "outro lado".** Como `targetType`/`targetId` não são uma FK tipada, não dá para pedir `relationship.findMany({ include: { target: true } })`. A resolução é feita em `relationships/queries.ts` (`resolveEntityRefs`): agrupa os `targetId`/`sourceId` por tipo e dispara **uma query por tipo envolvido** (no máximo 4, uma por `RelatableEntityType`), nunca uma query por relação — evita N+1 mesmo com dezenas de relações na mesma entidade.
- **Bidirecionalidade é uma linha só.** Uma relação "Franz trabalha para a Ordem do Crepúsculo" é uma única row (`source=NPC:Franz`, `target=FACTION:Ordem`). `listRelationshipsForEntity` busca tanto pelo lado `source` quanto pelo lado `target` e marca a direção (`outgoing`/`incoming`) no resultado, para a UI decidir o texto ("Franz → trabalha para → Ordem" vs. "Ordem ← trabalha para ← Franz"). Isso evita duplicar a relação como duas rows (que exigiria manter as duas em sincronia em toda edição/exclusão).
- **Ideias ficam fora do sistema de relações.** `RelatableEntityType` não inclui `IDEA` de propósito — Ideias são rascunhos pré-canônicos (ver 12.2); relacioná-las formalmente à wiki antes de virarem NPC/Local/etc. adicionaria um estado intermediário sem necessidade real no MVP da Fase 1.

### 12.2 `CanonStatus` vs. `archived` — dois eixos independentes

Toda entidade de conteúdo (NPC/Local/Facção/Lore) tem **dois** campos de estado, deliberadamente não fundidos em um só:

- `CanonStatus` (`DRAFT → PROPOSED → APPROVED → CANON`, mais `OBSOLETE`/`ARCHIVED` como saídas) — o eixo **narrativo**: o quão "oficial" essa informação é dentro da campanha, desde uma ideia ainda não compartilhada com a mesa até algo estabelecido em jogo, ou que deixou de valer.
- `archived: boolean` — o eixo **organizacional/de UI**: está fora da visão principal (lista padrão não mostra), mas continua existindo e mantém seu `canonStatus`.

São independentes porque um NPC pode ser `CANON` e `archived` (ex.: morreu na sessão passada — ainda é verdade estabelecida da campanha, só não precisa aparecer na lista do dia a dia) ou `DRAFT` e não-arquivado (uma ideia de NPC ainda sendo lapidada, mas ativa). Fundir os dois exigiria dobrar o enum (uma variante arquivada de cada estágio narrativo) só para cobrir a mesma matriz, sem ganho — e ainda obrigaria a UI de "arquivar" a decidir um `canonStatus` novo, quando a ação do usuário não diz nada sobre o eixo narrativo.

Ideias (`Idea`) não compartilham `CanonStatus` — têm o próprio `IdeaState` (`NEW → INTERESTING → DEVELOPING → USED`, ou `ARCHIVED`/`DISCARDED`), porque o ciclo de vida de uma ideia é sobre amadurecer até virar conteúdo de verdade (ou ser descartada), não sobre o quão canônica ela é — reaproveitar `CanonStatus` aqui misturaria dois conceitos que só coincidem por acaso terem o mesmo formato (enum de progressão).

### 12.3 Tags — por campanha, deduplicadas por slug

`Tag` pertence a uma `Campaign` (não é global no sistema) e é compartilhada entre todos os tipos de entidade via 5 tabelas de junção (`NpcTag`, `LocationTag`, `FactionTag`, `LorePageTag`, `IdeaTag`) — uma tabela por par entidade/tag em vez de uma junção polimórfica, porque aqui **dá** para ter FK real e são poucos pares fixos (ao contrário do caso de Relacionamentos em 12.1, onde o par não é fixo).

Deduplicação é por **slug** (`slugifyTagName`: normaliza acento/maiúsculas, troca não-alfanuméricos por hífen), não pelo texto exato: criar "Vilão" e depois "vilão" ou "VILÃO" resolve para a mesma tag (unique constraint em `(campaignId, slug)`). `createTagAction` primeiro busca por slug e retorna a tag existente se houver — nunca lança erro de "tag duplicada" para o usuário, porque do ponto de vista dele digitar de novo o nome de uma tag existente é a ação esperada, não um erro.

### 12.4 Hierarquia de Locais — auto-relação com prevenção de ciclo

`Location.parentLocationId` é uma auto-relação (`Location` referenciando `Location`). Dois mecanismos independentes previnem ciclos (A é pai de B, B é pai de A):

- **Checagem em nível de aplicação** (`updateLocationAction`): antes de trocar o pai de um local, `getLocationDescendantIds` faz uma busca em largura (BFS) por todos os descendentes do local sendo editado; se o novo pai proposto estiver nesse conjunto (ou for o próprio local), a action retorna `{ message: "..." }` em vez de gravar — e o seletor de local pai na UI (`LocationParentPicker`) já exclui esses IDs das opções, então na prática o usuário nunca vê o erro, mas ele existe como garantia de verdade.
- **`onDelete: Restrict` na FK** como rede de segurança de banco: impede apagar um local que ainda tem filhos, mesmo que algum caminho de código não passasse pela checagem de aplicação acima (a exclusão via UI já é bloqueada antes disso, com uma mensagem amigável — a constraint garante que não existe atalho que contorne a regra).

`getLocationBreadcrumb` sobe a árvore via `parentLocationId` até a raiz (inclui o próprio local no fim da lista retornada) para renderizar "Continente > Cidade > Bairro".

### 12.5 Lore — Markdown leve, não um editor rico

O requisito pedia "markdown leve", não um editor WYSIWYG completo (fora de escopo da Fase 1). A escolha foi um `<textarea>` simples com botão de pré-visualização, em vez de uma lib de editor (ex. TipTap/Lexical) — menos peso no bundle, e o público-alvo (mestre de RPG escrevendo lore) já costuma conhecer sintaxe Markdown básica de outras ferramentas (Discord, Notion, Obsidian).

Renderização é `marked` (parse) + `sanitize-html` (sanitização contra XSS, já que o conteúdo pode ser colado de qualquer lugar) — ambos rodam **só no servidor**: `sanitize-html` tem dependências pesadas para o bundle do cliente, e HTML gerado a partir de Markdown de usuário nunca deveria ser confiável sem sanitização, então não faz sentido ter um caminho client-side "rápido, mas inseguro". A pré-visualização ao vivo no editor usa uma Server Action (`previewMarkdownAction`) chamada com debounce — o usuário digita, mas o HTML final sempre passa pelo mesmo pipeline de sanitização que a renderização "de verdade" da página salva, evitando dois caminhos de renderização divergentes.

### 12.6 Busca global e Command Palette

`searchCampaign` roda uma query paralela por tipo de entidade (NPC/Local/Facção/Lore/Ideia), cada uma filtrando por `campaignId` e um `OR` entre nome/título, descrição/conteúdo e nome de tag associada — nunca carrega a campanha inteira em memória para filtrar no Node. A página `/search` usa isso para busca "de página" (URL com `?q=`, compartilhável/bookmarkável); o Command Palette (Ctrl+K) reusa a mesma Server Action via debounce, então os dois caminhos de busca nunca podem divergir em resultado.

O Command Palette escuta `keydown` global (`Ctrl+K`/`Cmd+K`) via `useEffect` numa única instância montada no shell da campanha; o botão de busca da topbar (que é renderizado por um Server Component) dispara a mesma abertura via um evento DOM customizado (`window.dispatchEvent`) em vez de prop drilling ou um contexto React atravessando a fronteira server/client. O atalho de teclado só é ativo depois que o componente cliente termina de hidratar — uma limitação inerente a qualquer atalho client-side em uma página recém-carregada (o mesmo vale para Linear, GitHub, etc.), não um bug: a suíte de teste correspondente aguarda `networkidle` antes de simular o atalho para não confundir esse instante de hidratação com uma falha.

### 12.7 Exclusão seg­ura

Toda exclusão de entidade de conteúdo segue o mesmo contrato: (1) a UI sempre pede confirmação explícita (`ConfirmDialog`, nunca clique único), (2) a action de exclusão nunca apaga conteúdo não relacionado — o único efeito colateral automático é limpar `Relationship`s que apontam para a entidade (12.1) — e (3) quando a exclusão não é segura por outro motivo (ex. Local com filhos, 12.4), a action retorna `{ error }` para a UI mostrar, em vez de deixar o Postgres estourar uma constraint como erro genérico 500.

## 13. Fase 2 — Decisões técnicas

### 13.1 Quest/PlotThread/Consequence entram no sistema de Relacionamentos; Scene/ChecklistItem/SessionPlan não

A Fase 1 já previa (ARCHITECTURE.md, seção 12.1) que estender `RelatableEntityType` seria "o custo esperado para plugar um novo tipo de conteúdo" — a Fase 2 é a primeira vez que isso acontece de verdade. `QUEST`, `PLOT_THREAD` e `CONSEQUENCE` foram adicionados ao enum e ganharam os mesmos 4 `case`s em `relationships/queries.ts` (`searchEntitiesByType`/`resolveEntityRefs`) que NPC/Local/Facção/Lore já tinham — nenhuma mudança estrutural no sistema de relacionamentos em si, só mais braços do mesmo `switch`. Isso valida a decisão original: o custo de adicionar um tipo novo foi mesmo pequeno e localizado.

`Scene` deliberadamente **não** entrou em `RelatableEntityType`, por um motivo prático, não filosófico: toda entidade relacionável precisa de uma página de detalhe própria para `getEntityHref` apontar (é para lá que o clique em "Ordem do Crepúsculo → traiu → Franz" leva). Cenas não têm página própria — são sempre editadas inline dentro da página da sua `SessionPlan` (seção 13.2) — então não haveria um destino de link sensato. Se cenas precisarem de relações com NPCs/Locais no futuro, a solução mais simples é dar a elas uma página própria primeiro (o que hoje não se justifica, dado seu papel de item de lista dentro de uma sessão) e só então estendê-las ao sistema polimórfico. `SessionPlan` e `ChecklistItem` ficaram de fora pelo mesmo motivo — e, no caso do `ChecklistItem`, também porque um item de checklist ("preparar mapa da cidade") não é o tipo de coisa que faz sentido "se relacionar" com um NPC.

### 13.2 Cenas e Checklist são filhos diretos de `SessionPlan` (FK real), não polimórficos

Diferente das Relações (12.1), a associação `SessionPlan` → `Scene`/`ChecklistItem` é 1-para-muitos com um tipo de pai **fixo** (uma cena sempre pertence a exatamente uma sessão, nunca a um NPC ou Local) — o caso clássico onde uma FK direta do Prisma é a ferramenta certa, e usar o sistema polimórfico aqui seria complexidade sem benefício (a lição inversa da 12.1: nem toda associação 1-para-muitos precisa do tratamento genérico, só as que de fato variam de tipo). `onDelete: Cascade` em ambas as tabelas: apagar uma `SessionPlan` apaga suas cenas e itens de checklist automaticamente — e isso é seguro porque cenas/checklist não têm existência própria fora do contexto da sessão (ao contrário de Relacionamentos, que apontam para entidades que sobrevivem à exclusão de qualquer lado específico).

Reordenar cenas usa um inteiro `order` simples com uma ação "mover para cima/para baixo" que **troca** o `order` da cena com a do vizinho dentro de uma `$transaction` — não uma biblioteca de drag-and-drop. Mesma filosofia da Fase 1 para o editor de Lore (12.5): a lista de cenas de uma sessão tipicamente tem poucos itens (uma sessão real raramente planeja mais de 5–8 cenas), então trocar de posição com dois cliques resolve o caso de uso real sem a complexidade de estado/acessibilidade de um drag-and-drop.

### 13.3 `PlotThread.importance` reaproveita `RelationshipImportance`

Em vez de criar um enum novo (`PlotThreadImportance` ou similar) apenas para "prioridade de uma trama", a Fase 2 reaproveita o `RelationshipImportance` (`LOW|MEDIUM|HIGH`) que a Fase 1 já criou para o campo `importance` de um `Relationship`. O conceito — "o quão importante isso é" — é genuinamente o mesmo em ambos os contextos, e o enum já tinha exatamente 3 valores com os rótulos certos (`RELATIONSHIP_IMPORTANCE_LABELS`, em `relationships/config.ts`, é reaproveitado como está). Criar um enum novo idêntico só para não ter uma dependência de nome cruzando módulos teria sido exatamente o tipo de abstração-por-precaução que o projeto evita.

### 13.4 `WikiEntityCard`/`WikiListFilters` generalizados para múltiplos enums de status

Todas as entidades da Fase 1 compartilham os mesmos dois enums de estado (`CanonStatus`, `Visibility`) — por isso `WikiEntityCard` (Fase 1) tinha esses dois campos com tipo fixo. As entidades de Preparação **não** compartilham `CanonStatus` (cada uma tem seu próprio ciclo de vida: `QuestStatus`, `PlotThreadStatus`, `ConsequenceStatus`, `SessionPlanStatus`, `SceneStatus` — ver 13.5) e não fazia sentido forçá-las a ter um `canonStatus` só para caber no componente antigo.

A correção foi generalizar em vez de duplicar: `WikiEntityCard` passou a receber um slot `statusBadges: ReactNode` em vez de campos `canonStatus`/`visibility` tipados — quem monta a lista decide o que renderizar ali (`<CanonStatusBadge/>` para NPCs, um `<Badge>` com `QUEST_STATUS_BADGE_VARIANT` para Missões, etc.). Da mesma forma, `WikiListFilters` virou `WikiListFilters<TStatus = CanonStatus>` — o parâmetro genérico deixa o tipo do filtro de status correto para cada domínio (`WikiListFilters<QuestStatus>`) sem duplicar a interface inteira, e o valor padrão mantém todo o código da Fase 1 compilando sem alteração. As 4 páginas de lista da Fase 1 (NPCs/Locais/Facções/Lore) foram ajustadas para montar `statusBadges` explicitamente — um custo pequeno e único, pago uma vez, que deixa o componente pronto para qualquer enum de status futuro (Fases 5+ certamente trarão mais).

### 13.5 `SessionPlanStatus`/`SceneStatus` não reaproveitam `CanonStatus`

Pelo mesmo raciocínio da seção 12.2 (Ideias têm seu próprio `IdeaState` em vez de `CanonStatus`): uma sessão progride de "planejando" para "pronta" para "concluída" — um ciclo de vida sobre **quando** algo acontece na mesa, não sobre o quão canônica a informação é. `CanonStatus` (`DRAFT → CANON`) responde "isso já é verdade estabelecida da campanha?", uma pergunta que não se aplica a uma sessão ou cena. Cada entidade de Preparação ganhou o enum que descreve seu próprio ciclo de vida real, em vez de forçar tudo pelo mesmo enum genérico só por conveniência de reuso.

### 13.6 Bug pré-existente descoberto: cache do roteador do Next.js pode mostrar dado obsoleto por um instante após excluir uma entidade que tinha uma relação

Durante o teste da Fase 2, uma suíte end-to-end expôs um comportamento: excluir uma entidade que **tinha** um `Relationship` associado e, logo em seguida, seguir o redirect da própria action de exclusão para a lista — a lista, por um instante, ainda mostra a entidade excluída (embora ela já não exista mais no banco, confirmado via query direta). Qualquer navegação ou reload subsequente mostra o estado correto imediatamente.

Reproduzido também com uma Facção da Fase 1 (não é uma regressão da Fase 2) — a causa é a interação entre o Router Cache do Next.js (client-side) e o `revalidatePath` chamado por uma action **anterior e não relacionada** (a criação do relacionamento, que revalida os caminhos das duas entidades envolvidas) com o `redirect()` de uma action **posterior** (a exclusão, que redireciona para a lista) — o destino do redirect aparenta reutilizar uma entrada de cache do roteador que não foi invalidada a tempo. A integridade dos dados nunca foi afetada (a exclusão em si, incluindo a limpeza transacional das relações, sempre aconteceu corretamente) — é puramente uma janela de exibição obsoleta no cliente. Documentado aqui como pendência de UX de baixo risco (seção "Pendências" do relatório da Fase 2); um tratamento completo exigiria trocar o `redirect()` do servidor por uma navegação client-side explícita (`router.refresh()` + navegação) em todas as actions de exclusão — adiado para não ampliar o escopo da Fase 2 além do que foi pedido.

## 14. Fase 3 — Decisões técnicas

### 14.1 Fila de escrita offline: desenho, o que ela garante e o que não garante

Esta é a peça prometida desde a Fase 0 (seções 7 e 8) e a decisão técnica mais importante desta fase. O requisito é real: uma mesa de RPG acontece num lugar com internet ruim ou nenhuma, e o mestre não pode perder uma anotação de sessão ou uma atualização de HP no meio do combate só porque o wi-fi caiu.

**O que foi construído:**

- `src/lib/offline-queue.ts` — um único IndexedDB local (`rpg-master-hub-offline`, object store `pending-writes`), sem biblioteca externa (mesma filosofia da Fase 0 para o Service Worker: convenção nativa do navegador, zero dependência nova). Cada escrita pendente é `{ id, op, campaignId, payload, queuedAt }`.
- `src/components/session-mode/use-offline-sync.ts` (`useOfflineSync`) — a ponte entre os painéis do Modo Sessão e a fila. Toda mutação passa por `queueOrRun(op, payload)`: se `navigator.onLine`, tenta a Server Action direto; se falhar por uma causa que parece falta de rede (`TypeError` de `fetch`, ou `navigator.onLine` já falso), cai para enfileirar no IndexedDB. Ao reconectar, ou periodicamente (a cada 4s, enquanto a fila não estiver vazia), tenta reenviar cada escrita em ordem.
- Cada painel (`SessionLogPanel`, `CombatTrackerPanel`) aplica a mutação **otimisticamente** no estado local do React antes mesmo de saber se ela foi para o servidor ou para a fila — o mestre nunca espera uma resposta de rede para ver o dado rolado ou a nota anotada na tela, online ou offline.

**O problema do id duplicado, e como foi resolvido:** a primeira versão gerava o id da entidade otimista no cliente (`crypto.randomUUID()`) e deixava o banco gerar seu próprio id (`cuid()`) na escrita real — dois ids diferentes para "a mesma" entidade. Isso quebrava qualquer mutação subsequente sobre aquele item (ex.: adicionar um combatente e, na sequência, ajustar o HP dele) porque o id local nunca existiu no banco. A correção: o **cliente** gera o id (`crypto.randomUUID()` para `Combatant`; um `clientId` separado para `SessionLogEntry`, que mantém seu próprio `id` de banco mas usa `@@unique([campaignId, clientId])` para que reenviar a mesma escrita — depois de já ter sido aplicada — vire um `upsert` sem duplicar) e o servidor usa **esse mesmo id** na criação (`db.combatant.create({ data: { id, ... } })`). Sem isso, o sistema simplesmente não funciona de forma confiável offline — é a peça que faz o resto do desenho funcionar.

**Por que não confundir "sem rede" com "erro de aplicação":** a primeira versão tratava qualquer exceção de `performWrite` como sinal de "deve estar offline, enfileira para tentar de novo depois" — o que significava que um bug real (ex.: o problema do id acima, que gera um erro `P2025 - registro não encontrado` do Prisma) entrava num loop de retry infinito, silenciosamente, escondendo o bug atrás de um indicador "pendente" que nunca virava "sincronizado". A correção distingue os dois casos (`isLikelyNetworkError`, em `use-offline-sync.ts`): só erro de rede genuíno vai para a fila; qualquer outro erro é descartado da fila (não adianta reenviar o mesmo erro) e reportado via `console.error` + status `error` no indicador — honesto sobre o fato de que algo deu errado de verdade, em vez de fingir que é só uma questão de tempo.

**Por que o evento `online` do navegador não é suficiente sozinho:** durante o desenvolvimento, o teste automatizado (que usa a emulação de rede do Chromium via Playwright) revelou que bloquear/desbloquear requisições de rede nem sempre dispara o evento `online`/`offline` do navegador de forma confiável — a emulação de rede e o valor de `navigator.onLine` são coisas diferentes, e podem divergir. Isso não é só uma peculiaridade de teste: uma conexão real "instável" (alterna entre funcionando e não, sem uma transição limpa) tem o mesmo problema. Por isso a fila também tenta descarregar periodicamente (a cada 4s), não só reagindo ao evento — o evento é a via rápida quando funciona, o polling é a rede de segurança.

**O que este desenho deliberadamente NÃO faz** (e por quê isso é honesto, não incompleto): não há resolução de conflito entre dois dispositivos editando a mesma sessão ao mesmo tempo (CRDT, operational transform). A fila é local a um navegador; se o mesmo mestre abrir o Modo Sessão em dois dispositivos ao mesmo tempo enquanto ambos ficam offline, cada um tem sua própria fila e a ordem final de aplicação ao reconectar é "por dispositivo, na ordem em que reconectou" — sem merge inteligente. Isso é aceitável porque uma mesa de RPG tem **um mestre, rodando a sessão de um dispositivo por vez** — não é um documento colaborativo com múltiplos editores simultâneos. Construir CRDT para um cenário que não existe na prática seria complexidade sem benefício real, o oposto do que este projeto valoriza.

### 14.2 Por que só o Modo Sessão ganhou cache agressivo no Service Worker

A Fase 0 previu (seção 7) "cache agressivo de dados de campanha para uso offline real" chegando nesta fase, mas isso foi interpretado de forma **escopada**, não como "cachear o app inteiro": o Service Worker agora usa uma estratégia network-first-com-snapshot especificamente para `/campaigns/*/session` (tenta a rede, cai para a última versão em cache — não para `/offline` — se falhar). Todas as outras páginas (NPCs, Locais, Missões, Sessões de preparação...) continuam com a estratégia original da Fase 0 (rede ou `/offline`). A razão é a mesma que já apareceu nas Fases 1 e 2 para outras decisões de escopo: o Modo Sessão é a única tela pensada para ser usada **durante** a mesa, quando perder conexão é uma possibilidade real e cara; as demais são ferramentas de preparação, usadas antes/depois, onde "recarregue quando a internet voltar" é uma resposta honesta e suficiente.

### 14.3 Combat Tracker: sem "iniciativa automática", sem rolagem embutida

O Combat Tracker guarda um campo `initiative` por combatente e ordena por ele, mas quem calcula/rola a iniciativa é o mestre (usando o Dice Roller ao lado, se quiser) — o formulário de adicionar combatente só tem um campo numérico. Da mesma forma, `activeCombatantId` e `round` avançam por um botão "Próximo turno" que o mestre aciona manualmente, não por um timer ou lógica de sistema de jogo (D&D, Fabula Ultima, etc. têm regras de iniciativa muito diferentes entre si, e este produto não assume nenhum sistema específico — ver Fase 6, Game Tools, para onde regras específicas de sistema eventualmente pertencem, se um dia entrarem).

### 14.4 Dice Roller: puro, sem persistência própria

`src/lib/dice.ts` só faz parse de notação (`2d6+3`) e rola com `Math.random()` — nenhuma chamada de rede, nenhum estado, nenhuma dependência do Prisma. A rolagem em si não é uma entidade do banco; o que persiste é o **resultado formatado**, como uma `SessionLogEntry` do tipo `DICE_ROLL` (texto simples, ex. "2d6+3: [4, 6] +3 = 13"). Isso mantém a lógica de dados testável e reutilizável (funciona igual dentro ou fora do Modo Sessão, online ou offline) sem precisar desenhar uma tabela "DiceRoll" cujo único propósito seria guardar o mesmo texto de forma mais estruturada sem necessidade real hoje.

### 14.5 NPC rápido e Botão do pânico: por que ficaram fora da fila offline

`quickCreateNpcAction` (NPC rápido) e o Botão do pânico foram deliberadamente deixados fora do sistema de fila offline. O Botão do pânico não tem motivo para entrar — é 100% local (arrays estáticos, `Math.random()`), nunca toca o servidor. Criar um NPC no meio da sessão é mais raro do que rolar dados ou ajustar HP (o caso de uso real: o mestre percisa nomear alguém que os jogadores encontraram, uma ou duas vezes por sessão, não a cada poucos segundos como uma rolagem) — o custo de tratar essa exceção (mostrar um erro pedindo para tentar de novo quando a conexão voltar) foi julgado menor que o custo de generalizar a fila para mais um tipo de operação, incluindo o id-gerado-no-cliente que isso exigiria para o NPC entrar depois no sistema de Tags/Relacionamentos sem conflito.

## 15. Fase 4 — Decisões técnicas

### 15.1 `AudioTrack` faz o papel de "preset" — sem tabela separada

O roadmap da Fase 0 (seção 10) falava em "Presets" como conceito próprio, mas não havia requisito de um preset agrupar várias faixas ou guardar configuração além de "qual arquivo, de qual categoria, com ou sem loop". Criar uma tabela `Preset` que apontasse para um único `AudioTrack` seria uma indireção sem função: cada faixa enviada já É o botão que aparece no board. `AudioTrack` guarda `name`, `category` (`MUSIC`/`SFX`), `fileUrl` e `loop`, e isso basta para o board renderizar e para os bots tocarem. Se uma fase futura pedir presets reais (ex.: uma "cena" disparando várias faixas de uma vez), o conceito entra então, sobre o que já existe.

### 15.2 `DiscordLink` por ID manual — sem OAuth "Login with Discord"

Conectar a campanha a um servidor/canal de voz do Discord poderia ser feito com um fluxo OAuth completo (o mestre loga com a conta Discord, o hub lista servidores e canais reais via API). Isso foi deliberadamente trocado por dois campos de texto (`guildId`, `voiceChannelId`) que o mestre copia manualmente do Discord com o Modo Desenvolvedor ativado. Motivo: OAuth exigiria uma segunda aplicação Discord (ou escopos adicionais nas duas já criadas), telas de consentimento, refresh de token e uma camada de API do Discord só para listar servidores — complexidade real para economizar copiar-colar dois números que o mestre faz uma vez por campanha. O texto de ajuda no próprio formulário (`discord-link-form.tsx`) explica o passo a passo.

### 15.3 `MusicPlaybackState` vs. `SfxTriggerEvent` — dois modelos porque são dois tipos de evento

Música e efeito sonoro têm semânticas de reprodução opostas, e o schema reflete isso com dois modelos diferentes em vez de forçar um só:

- **`MusicPlaybackState`** — uma linha por campanha (`campaignId @unique`), mutável: `trackId`/`isPlaying` descrevem "o que deveria estar tocando agora". É estado contínuo — o bot de música consulta e faz seu estado de conexão convergir para esse estado (entra no canal, troca de faixa, para), sem histórico.
- **`SfxTriggerEvent`** — log **append-only**: cada clique em "Tocar" no board cria uma linha nova, com `processedAt` nulo até o bot confirmar que tocou (`processedAt: DateTime?`). Um efeito sonoro é "dispare isso uma vez", não um estado para convergir — não faria sentido um `upsert` sobrescrever o efeito anterior antes de ele ter sido reproduzido.

### 15.4 Hub ↔ bots: polling, não push

Os bots consultam o hub (`GET /api/v1/bot/music` a cada 4s, `GET /api/v1/bot/sfx` a cada 2s) em vez do hub empurrar eventos para eles. Escolhido porque só exige acesso de rede **de saída** a partir do processo do bot — nenhuma porta precisa ser aberta, nenhum webhook precisa ser exposto publicamente, o bot pode rodar atrás de NAT/firewall doméstico sem configuração extra. O custo (latência de até um intervalo de polling, no pior caso) é aceitável: 2-4 segundos de atraso para tocar um efeito sonoro ou trocar uma música não compromete a experiência de mesa.

### 15.5 Autenticação dos bots: secret compartilhado, nunca sessão de usuário

`BOT_SERVICE_SECRET` é comparado em `src/lib/bot-auth.ts` contra o header `Authorization: Bearer <secret>` — sem OAuth, sem JWT, sem cookie de sessão. Os bots são processos de infraestrutura confiáveis (não agem "como" um usuário específico, agem para todas as campanhas que tiverem `DiscordLink` configurado), então o modelo certo é o mesmo de um serviço interno falando com outro, não o de autenticação de usuário final — consistente com o que a seção 10 (Fase 0) já previa antes de qualquer código existir.

### 15.6 Resolução de URL de arquivo entre provedores de storage

`resolveFileUrl(origin, fileUrl)` (`src/lib/bot-auth.ts`) devolve `fileUrl` sem alteração se já for uma URL absoluta (`http(s)://...` — caso do Vercel Blob em produção) e monta `${origin}${fileUrl}` se for um caminho relativo (`/uploads/...` — caso do storage local em desenvolvimento). O `origin` vem de `new URL(request.url).origin`, ou seja, da própria requisição que o bot fez ao hub — nenhuma variável de ambiente nova precisou ser criada no lado do hub, e o bot nunca precisa saber qual provedor de storage está ativo.

### 15.7 SFX: fila de um efeito por vez por campanha, sem mixagem real

O bot de efeitos sonoros (`bot/sfx-bot.js`) tem uma fila (`queue: string[]`) por campanha: se um efeito já está tocando quando outro é disparado, o novo entra na fila e só toca quando o anterior termina — nunca os dois sobrepostos. Mixar múltiplos efeitos simultâneos exigiria decodificar e somar streams de áudio (ou várias conexões de voz simultâneas no mesmo canal, que o Discord não permite para um único bot), um escopo bem maior do que "o mestre clica e o som toca". Isso é um corte de escopo deliberado do MVP, não uma limitação técnica descoberta depois — para a maioria dos efeitos de mesa (porta rangendo, espada, trovão) o disparo é esporádico o bastante para a fila nunca ser perceptível.

### 15.8 Bots rodam sob demanda, durante a sessão — não como serviço 24/7

Ao contrário do que a seção 10 sugeria inicialmente ("processo Node separado e persistente"), a persistência não precisa significar "ligado o tempo todo": o mestre inicia os dois processos (`npm run music` / `npm run sfx`, na própria máquina ou onde preferir) antes de começar a jogar e encerra ao final da sessão. "Persistente" aqui quer dizer apenas "processo Node de longa duração enquanto está rodando" (mantém conexão de voz aberta), não "sempre ativo" — não há necessidade de hospedagem 24/7 (VPS, Railway, Fly.io) para o uso real do produto, embora continue sendo uma opção válida para quem preferir não depender de ligar o processo manualmente. `bot/README.md` documenta esse uso sob demanda como o caminho padrão.

### 15.9 Segurança da cadeia de dependências: `@discordjs/opus` trocado por `opusscript`

A primeira instalação de `bot/` com `@discordjs/opus` (bindings nativos, via `@discordjs/node-pre-gyp`) resultou em 3 vulnerabilidades no `npm audit` (2 altas, 1 crítica) — todas na cadeia de dependência de `tar` usada para baixar o binário pré-compilado durante a instalação, sem correção disponível mesmo na versão mais recente do pacote. Como `@discordjs/opus` era apenas uma de várias implementações de Opus intercambiáveis que `@discordjs/voice` sabe usar (detecção em tempo de execução, não uma dependência obrigatória), a correção foi trocá-lo por `opusscript` — implementação em JavaScript/WASM puro, sem etapa de build nativo. Resultado: 0 vulnerabilidades. `generateDependencyReport()` (função de diagnóstico do próprio `@discordjs/voice`) confirmou que a cadeia completa de áudio continua resolvendo corretamente (Opus via `opusscript`, criptografia via `libsodium-wrappers`, FFmpeg via `ffmpeg-static`, detectado automaticamente pelo `prism-media`).

### 15.10 Limitação do ambiente de desenvolvimento: conectividade real do Discord nunca verificada

A política de rede do sandbox onde este projeto foi desenvolvido bloqueia conexões de saída para `discord.com`. Isso significa que a conexão real ao Gateway e ao Voice do Discord **nunca pôde ser testada de dentro deste ambiente** — nem login do bot, nem entrada em canal de voz, nem reprodução de áudio de fato. A verificação desta fase ficou limitada ao que é possível sem rede: schema e queries do banco, lógica e autenticação das rotas `/api/v1/bot/*` (testadas via HTTP direto contra um servidor local, incluindo o ciclo completo disparo → fila pendente → confirmação), toda a interface web do Music/SFX Board (upload, tocar/pausar música, disparar efeito, excluir faixa, salvar vínculo do Discord), sintaxe dos dois scripts de bot (`node --check`) e verificação de que as chamadas de API do `@discordjs/voice` usadas (`createAudioResource` com string de URL, `joinVoiceChannel`, etc.) existem e têm a assinatura esperada nos `.d.ts` do pacote instalado. A conectividade real com um servidor Discord de verdade precisa ser confirmada manualmente, uma vez, em uma máquina com acesso à internet, antes do primeiro uso em mesa (ver `bot/README.md`).

### 15.11 Bug pré-existente descoberto: rota de upload exigia `OWNER` para qualquer arquivo de campanha

Ao testar o fluxo de upload de áudio com uma conta `CO_GM` (não dona da campanha) — necessário porque `createAudioTrackAction` já exigia apenas `CO_GM`, seguindo a convenção da seção 9 — o upload em si falhava com 403 antes mesmo de a action rodar. A causa: `src/app/api/v1/uploads/route.ts` checava `requireCampaignAccess(user.id, campaignId, "OWNER")` para qualquer upload vinculado a uma campanha, desde a Fase 0 — um resquício de quando só existia o papel `OWNER` de fato (seção 9). Isso nunca tinha sido pego porque os testes anteriores de upload (retratos de NPC, símbolos de Facção, etc.) sempre rodaram com a conta dona da campanha. Na prática, isso bloqueava qualquer `CO_GM` de enviar uma imagem ou um áudio para qualquer entidade que ele tivesse permissão de criar — uma contradição com o próprio modelo de permissões que todo o resto do app segue desde a Fase 1. Corrigido trocando o mínimo exigido para `CO_GM`, testado com uma conta `CO_GM` de verdade (login separado, sessão própria) confirmando que o upload e a criação da faixa completam com sucesso.

## 16. Fase 5 — Decisões técnicas

### 16.1 `RelatableEntityType` ganha TIMELINE_EVENT e MYSTERY — mesmo custo já previsto

Como a seção 13.1 já documentou para Quest/PlotThread/Consequence na Fase 2, estender o sistema de Relacionamentos a um tipo de conteúdo novo continua sendo "mais um braço do mesmo `switch`": `TIMELINE_EVENT` e `MYSTERY` entraram no enum e ganharam os mesmos `case`s em `searchEntitiesByType`/`resolveEntityRefs` que os sete tipos anteriores já tinham. Timeline e Mystery ganharam esse tratamento porque as duas têm página de detalhe própria (o critério que a seção 13.1 já usava para decidir "entra ou não entra"); `NarrativeClock` e `FamilyRelation` deliberadamente ficaram de fora — ver 16.2 e 16.3.

### 16.2 Calendário: contador simples embutido na Timeline, não um sistema de datas customizável

O roadmap descrevia duas opções: um calendário customizável por campanha (nomes de meses/dias próprios do mundo de ficção) ou, como corte de escopo mais simples, um contador de "dia atual". Optamos pelo contador (`CampaignCalendar`: `currentDay`/`dayLabel`, singleton por campanha no mesmo padrão de `DiscordLink`/`MusicPlaybackState` da Fase 4) por dois motivos:

- **Um calendário customizável é, na prática, uma segunda entidade de configuração por sistema de jogo** — nomes de meses, quantos dias tem cada um, quantos meses tem o ano, se existem semanas — e cada mesa de RPG usa um calendário de ficção diferente (ou nenhum, contando só "sessão 1, sessão 2..."). Modelar isso bem exigiria uma UI de configuração própria (criar/editar/reordenar meses) só para um recurso que a Timeline já cobre parcialmente com `narrativeDate` em texto livre — o mestre pode escrever "12 de Chuvamar, Terceira Era" ali sem o app precisar entender o que isso significa.
- **Não existe uma página própria do calendário.** Em vez disso, `CampaignCalendarWidget` é um card no topo da página `/timeline` — a mesma filosofia da seção 15.1 (`AudioTrack` como "preset" sem tabela própria): o conceito é pequeno o bastante para não justificar uma rota/CRUD dedicados, e semanticamente pertence à Timeline mesmo (o roadmap já dizia "associado à Timeline"). Editar rótulo/dia é um diálogo simples; avançar/voltar um dia são dois botões que chamam `advanceCalendarDayAction` diretamente, sem formulário.

Isso significa que, das 5 sub-features do roadmap, Calendário não ganhou um item de navegação próprio — está embutido dentro do item "Linha do Tempo". Julgamos isso mais honesto do que criar uma rota vazia só para preencher a lista de navegação.

`NarrativeClock` também ficou fora do sistema de Relacionamentos e sem `visibility`/tags, pelo mesmo raciocínio da seção 13.5 (`SessionPlan` não tem `canonStatus`/`visibility`): um relógio narrativo é uma ferramenta de acompanhamento do mestre ("quanto falta para o culto terminar o ritual?"), não conteúdo compartilhável da wiki da campanha. CRUD completo (criar/editar/arquivar/excluir) mais os dois botões de incrementar/decrementar cobrem o requisito sem esse peso extra.

### 16.3 Family Tree: tabela dedicada `FamilyRelation`, não o sistema genérico de Relacionamentos

A mesma decisão de desenho da seção 12.1 (associação polimórfica vs. FK real) reapareceu aqui, com a resposta oposta. Opções consideradas:

- **Reaproveitar `Relationship`** com `type` livre ("é pai de", "é cônjuge de"): zero schema novo, mas dois problemas reais. Primeiro, texto livre não dá para consultar de forma confiável — "todos os pais deste NPC" viraria um `LIKE` sobre uma string que o mestre poderia digitar de qualquer jeito ("é pai de", "pai de", "é o pai de"), quebrando a árvore visual. Segundo, `Relationship` não tem noção de direção *tipada*: hoje a UI decide o texto da seta (`outgoing`/`incoming`) olhando pra qual lado é `source`, mas isso não basta para calcular "quem são os avós" — precisaria de uma regra a mais em cima de texto livre.
- **Tabela dedicada `FamilyRelation`** (escolhida): FK real para `Npc` dos dois lados (`npcAId`/`npcBId`) porque, ao contrário do caso da seção 12.1, os dois lados são **sempre** do mesmo tipo (NPC) — não existe "parentesco entre um NPC e uma Facção". Sem essa variação de tipo, a razão de ser da associação polimórfica desaparece, e a FK real dá integridade de banco de graça (`onDelete: Cascade`: apagar um NPC apaga os parentescos dele, nunca deixando uma referência solta). Um enum fechado (`FamilyRelationType`: `PARENT_OF`/`SPOUSE_OF`/`SIBLING_OF`) substitui o texto livre — a árvore em `tree.ts` sabe exatamente que aresta é uma relação de filiação (para desenhar a hierarquia) e que aresta é só uma anotação lateral (cônjuge/irmão).

Consequência assumida: `PARENT_OF`/`SIBLING_OF`/`SPOUSE_OF` cobrem o pedido do roadmap ("pai de", "cônjuge de", "irmão de") mas não modelam parentescos mais distantes (tio, primo, sogro) — se isso for pedido no futuro, a resposta mais simples é derivar visualmente ("tio" = irmão de um dos pais) em vez de crescer o enum, já que esses são sempre combinações de PARENT_OF/SIBLING_OF/SPOUSE_OF existentes, não um tipo de aresta novo.

`buildFamilyTrees` (`family-tree/tree.ts`) é uma função pura (sem acesso a banco) que monta a árvore a partir das linhas: raízes são NPCs sem um `PARENT_OF` apontando para eles; cônjuges e irmãos aparecem como anotação inline em cada nó, não como recursão. Limitação assumida e documentada no próprio código: quando um NPC tem dois pais registrados (sem uma relação de cônjuge entre eles), ele aparece pendurado embaixo de só um dos dois ramos, não dos dois ao mesmo tempo — um grafo genealógico "de verdade" (DAG com pais combinados) exigiria um algoritmo de layout bem mais complexo para o ganho visual que traria numa árvore de campanha de RPG, que normalmente não tem dezenas de gerações.

A página dedicada `/family-tree` é **somente leitura** — adicionar/remover parentesco só acontece a partir do painel "Família" na página de cada NPC (mesmo padrão de Relacionamentos: não existe uma página global para *criar* relações, só para visualizá-las agrupadas por entidade).

### 16.4 Clue → entidade: ponteiro polimórfico leve, não uma linha em `Relationship`

Uma pista de Mistério pode opcionalmente apontar para um NPC/Local/Facção/etc. O roadmap pede isso "via Relacionamentos", mas uma pista (`Clue`) não tem página de detalhe própria — é sempre editada inline dentro do Mistério, o mesmo motivo pelo qual `Scene`/`ChecklistItem` ficaram fora de `RelatableEntityType` (seção 13.1). Sem página própria, não haveria destino para `getEntityHref` apontar do lado da pista, e um `Relationship` de verdade exige dois lados relacionáveis.

A solução foi um meio-termo: `Clue.linkedEntityType`/`linkedEntityId` são um ponteiro polimórfico direto (mesmo par tipo+id do sistema de Relacionamentos), mas **sem** uma linha na tabela `Relationship` — resolvido por `resolveClueLinks` (`mysteries/queries.ts`), que reaproveita `resolveEntityRefs` (o mesmo resolvedor em lote por tipo que `listRelationshipsForEntity` usa) em vez de duplicar essa lógica. Isso dá o "via Relacionamentos" no sentido de reaproveitar a infraestrutura de resolução polimórfica, sem forçar uma pista a virar uma entidade relacionável de primeira classe que não tem para onde linkar de volta. O Mistério em si (que tem página própria) entra em `RelatableEntityType` normalmente — é ele, não cada pista, que pode aparecer como o "outro lado" de uma relação genérica (ex.: um NPC "é suspeito em" um Mistério).

### 16.5 Reordenação de Timeline: mesmo padrão de troca de `order`, aceitando o mesmo limite já conhecido

`moveTimelineEventAction` copia exatamente o desenho de `moveSceneAction` (seção 13.2): troca o campo `order` entre a linha e a vizinha dentro de uma `$transaction`, sem biblioteca de drag-and-drop. A diferença é o volume esperado — uma sessão tem poucas cenas, mas uma campanha de meses pode acumular dezenas de eventos históricos. Julgamos que mover um evento várias posições de uma vez (arrastar do fim para o início) ainda é raro o bastante no uso real (a maioria dos eventos é adicionada perto de onde deveria ficar cronologicamente) para não justificar ainda uma biblioteca de arrastar-e-soltar nesta fase — se isso se provar frustrante em uso real, um passo intermediário mais barato que uma lib de D&D seria um campo "mover para o topo/fim" antes de considerar arrastar de verdade.

## 17. Fase 6 — Decisões técnicas

### 17.1 Monster/Boss Forge: um único modelo com `isBoss`, atributos como lista livre chave/valor

O roadmap pedia "Monster/Boss/Item Forge" sem detalhar se Monstro e Chefe deveriam ser modelos separados. Optamos por um único modelo `Monster` com um campo `isBoss: Boolean` em vez de duas tabelas (`Monster`/`Boss`) ou um enum de categoria: um chefe **é** um monstro, só com um peso narrativo/mecânico maior — os dois compartilham 100% dos campos (nome, descrição, atributos, tags, relações), então duas tabelas duplicariam schema, queries e páginas só para diferenciar algo que um booleano já resolve. A lista de NPCs/monstros da campanha também fica mais simples de filtrar ("mostrar só chefes") com uma coluna do que com um `UNION` entre duas tabelas.

O ponto mais importante da seção 14.3 (Combat Tracker sem regras de sistema específico) se aplica aqui com força total: estatísticas de monstro variam completamente entre sistemas — D&D tem "Classe de Armadura" e "Bônus de Proficiência", Fabula Ultima tem atributos diferentes, um homebrew pode ter qualquer coisa. Em vez de colunas fixas (`hp`, `attack`, `defense`...) que assumiriam um sistema, `MonsterAttribute` é uma lista de linhas chave/valor (`"HP" → "40"`, `"Ataque" → "+5"`) — filho direto de `Monster` (FK real, `onDelete: Cascade`), no mesmo padrão de `Clue`/`Scene` (seções 13.2/16.4): sem página própria, sempre editado inline na página do monstro, só adicionar/remover (sem edição in-place, mesmo corte de escopo da seção 16.4 para `Clue` — trocar um atributo errado é excluir e adicionar de novo). Isso é literalmente texto livre para estatísticas, não uma calculadora de regras de um sistema específico, exatamente como a seção 14.3 já pedia para o Combat Tracker.

`Monster` entra em `RelatableEntityType` e ganha Tags/canonStatus/visibility como qualquer outra entidade de conteúdo (NPC/Local/Facção/Lore) — reaproveitar o eixo `CanonStatus` em vez de inventar um `MonsterStatus` novo é a mesma lógica da seção 12.2: um monstro pode estar em rascunho até ser aprovado pela mesa, ou virar `CANON` depois de aparecer numa sessão, exatamente como qualquer outro conteúdo da wiki.

### 17.2 Item Forge e Power Builder: mesmo tratamento de "entidade de conteúdo", sem mecânica nova

`Item` (nome, `category` como um único campo de texto livre cobrindo "tipo/raridade" — ex. "Arma rara", "Anel +1" — description, effect) e `Power` (nome, `cost` livre — ex. "2 PM", "Ação bônus" — description, effect) seguem o mesmo molde de `Monster`: `canonStatus`/`visibility`/`favorite`/`archived`/tags, participam de Relacionamentos, aparecem na Busca global e no Command Palette. Nenhum dos dois ganhou campos numéricos fixos (dano, bônus, alcance) pelo mesmo motivo da seção 17.1 — cada sistema de jogo modela isso de forma incompatível entre si, e o produto não assume nenhum.

O roadmap perguntava explicitamente se Power deveria "ficar como uma lista solta por campanha" ou ser vinculável a Monstro/NPC/Item "via Relacionamentos". Escolhemos dar a `Power` o tratamento completo de entidade de conteúdo (não uma lista solta) porque o custo marginal era zero — o padrão já existe e é só mais um tipo no mesmo `switch` de `relationships/queries.ts` (validando de novo a seção 13.1: "o custo de adicionar um tipo novo é mesmo pequeno e localizado") — e o ganho é real: um mestre pode agora vincular "Sopro de Fogo" ao Dragão que o usa, sem inventar uma segunda forma de associação só para poderes. `category`/`cost` como um campo de texto livre só (em vez de dois campos, ex. `itemType` + `rarity`) é o corte de escopo mais simples que ainda atende ao pedido literal do roadmap ("tipo/raridade livre") sem multiplicar inputs por uma distinção que nem todo sistema faz.

### 17.3 Table Builder é o motor; Loot Generator é a mesma tabela com `kind = LOOT`

O roadmap já sugeria avaliar se Loot Generator deveria ser construído sobre Table Builder "já que uma tabela é 'de loot' só por convenção de uso" — avaliamos e a resposta foi sim, sem ressalvas. `RollTable`/`RollTableEntry` são um único par de modelos; o campo `kind` (`GENERIC` | `LOOT`) é a única diferença de schema, e existe só para separar as duas listagens (`/tables` mostra `kind: GENERIC`, `/loot` mostra `kind: LOOT`) — não existe nenhuma regra de negócio que dependa de `kind` além disso. As rotas, a terminologia da UI ("Entrada"/"Peso" na Table Builder vs. "Item"/"Chance" no Loot Generator) e um campo de quantidade no roller (Loot Generator sorteia N itens de uma vez; Table Builder sempre sorteia 1, o equivalente a "rolar o dado uma vez") são a única coisa que muda entre as duas features — a mesma lição da seção 13.1 aplicada a features inteiras, não só a um tipo de relacionamento: reaproveitar em vez de duplicar quando o modelo de dados é genuinamente o mesmo.

A segunda decisão foi como representar "uma entrada de d20 associada a uma faixa 1-3" sem pedir ao mestre para digitar e validar faixas numéricas contra o dado sendo usado. Em vez de campos `rangeMin`/`rangeMax`, `RollTableEntry` só tem `weight: Int` — um peso relativo já representa o tamanho de um intervalo (peso 3 é equivalente a uma faixa de 3 números em um d20) sem exigir que a soma dos pesos bata com nenhum dado específico (d20, d100, ou uma tabela com 7 entradas que não corresponde a dado nenhum). Isso também é o que já cobre "peso/chance" pedido para o Loot Generator — um único campo serve as duas features sem ramificação de schema.

O sorteio (`roll.ts`, `rollWeightedEntries`) é puro — sem I/O, mesma filosofia do `src/lib/dice.ts` da Fase 3 (seção 14.4) — e sorteia **com reposição** (a mesma entrada pode sair mais de uma vez numa rolagem de N itens): sem essa simplificação, "sortear sem repetir" exigiria remover e reponderar o pool a cada item sorteado, complexidade que nem um dado físico tem e que a maioria dos casos de uso reais (loot de uma masmorra, uma tabela de encontros) não pede. `rollRollTableAction` busca as entradas do banco a cada rolagem (nunca confia num estado já carregado no cliente) para nunca sortear com pesos desatualizados, e exige só o papel mínimo padrão (`PLAYER`) — rolar é leitura, não muda nada no banco, mesmo critério de qualquer página de detalhe da wiki.

`RollTable` ficou de fora de `RelatableEntityType`/tags/visibility — mesmo raciocínio de `NarrativeClock` (seção 16.2) e `SessionPlan` (seção 13.5): é uma ferramenta de mesa do mestre ("rolar um evento aleatório", "sortear o loot de um baú"), não conteúdo compartilhável da wiki da campanha, então não se beneficia do peso extra desses três eixos.

Por fim, o roteiro sugeria (opcionalmente) persistir o resultado de uma rolagem no Session Log. Implementamos isso como um botão "Registrar no Log da Sessão" no roller, que reaproveita `createLogEntryAction` (`modules/game/session-log/actions.ts`, já existente desde a Fase 3) com `type: "NOTE"` em vez de criar um novo `SessionLogEntryType` — o resultado de uma tabela é só mais uma anotação de texto, exatamente como uma rolagem de dado já é registrada como texto formatado (seção 14.4), sem justificar um tipo de entrada dedicado só para isso.

## 18. Fase 7 — Decisões técnicas

### 18.0 Escopo central: pré-IA, não IA de verdade

A decisão mais importante desta fase é o que ela **não** faz: nenhuma chamada de rede a um provedor de LLM, nenhuma "sugestão inteligente" gerada por um modelo, nenhuma dependência nova de API externa. As quatro sub-features (Campaign Brain avançado, Context Engine, Campaign Health, Content Graveyard) são inteligência no sentido de **agregação e heurística sobre dados que já existem** — o hub cruza informação que o próprio mestre já cadastrou (contadores, `updatedAt`, `canonStatus`, `archived`, Tags, Relacionamentos) e mostra algo útil, mas não "pensa" sobre a campanha. A Fase 8 ("IA") é onde entram Lore Guardian, Canon Checker, Campaign Recall e Consequence Suggester — aí sim chamando um modelo de linguagem de verdade, sempre como copiloto, nunca como autoridade. Confundir as duas coisas nesta fase teria sido o erro mais fácil de cometer, dado o nome do domínio ("Inteligência") — por isso este corte está registrado aqui explicitamente, antes de qualquer outra decisão desta seção.

Consequência prática: nenhuma das quatro sub-features abaixo precisou de uma tabela nova no banco. As quatro são queries de leitura (algumas com pequenas funções puras de agregação) sobre modelos que já existiam desde as Fases 1–6, mais um punhado de actions que já existiam por entidade (`toggle*ArchivedAction`/`delete*Action`, seção 12.7) reaproveitadas por um despachante fino. A migração `20260912`... nem chegou a ser criada — `prisma migrate status` confirmou o schema já estava em dia antes de qualquer código desta fase.

### 18.1 Campaign Brain avançado: feed unificado + distribuição canônico/rascunho, não um "resumo de tudo"

O Dashboard da Fase 1 (`core/dashboard/queries.ts`) já cobre "recentes" e "favoritos", mas só para os 8 tipos de conteúdo que existiam até a Fase 2 (NPC/Local/Facção/Lore/Ideia/Missão/Trama/Consequência) — Timeline, Relógios, Mistérios, Monstros, Itens, Poderes, Tabelas e Sessões (Fases 5-6) nunca entraram lá. Em vez de reescrever o Dashboard (fora de escopo: ele é a tela do dia a dia, deliberadamente enxuta), o Campaign Brain (`modules/intelligence/brain/queries.ts`, painel `/campaigns/[campaignId]/brain`) é a versão "completa":

- **`listUnifiedRecentActivity`** — o mesmo padrão de `listRecentEntities` do Dashboard (uma query por tipo, `Promise.all`, merge + sort por `updatedAt` em memória), mas para os 17 tipos de conteúdo hoje existentes na campanha (todo `ContentEntityType`, seção 18.6). É literalmente "o que mudou desde a última vez", exatamente como o roadmap sugeria — sem precisar guardar um timestamp de "última visita" por usuário (o que exigiria uma tabela nova só para isso); `updatedAt`, que já existe em toda entidade, já responde a pergunta.
- **`getCanonStatusBreakdown`** — quanto de cada tipo com `canonStatus` (os 7 da seção 12.2: NPC/Local/Facção/Lore/Monstro/Item/Poder) está em cada estágio do enum, via `groupBy` (uma query por tipo, nunca carregando as linhas inteiras). Deliberadamente inclui conteúdo arquivado na contagem — `canonStatus` é o eixo narrativo, `archived` é o eixo organizacional (seção 12.2), e um item arquivado não deixa de ter uma resposta para "isso é canônico?".

O que foi **descartado** e por quê: um terceiro card de "contagem total por tipo" (tipo o grid de `contentCounts` do Dashboard, mas com os 17 tipos) foi cogitado e descartado por redundância — o Dashboard já cobre a maioria, e a proporção arquivado/ativo por tipo já é o assunto do Campaign Health (seção 18.3); um terceiro lugar mostrando quase a mesma coisa seria ruído, não "avançado". O card "Campaign Brain" (placeholder desde a Fase 1) no Dashboard foi atualizado para linkar para o painel de verdade em vez do texto "Em breve".

### 18.2 Context Engine: raio-x de uma entidade, não um segundo formulário

"Dado qualquer entidade relacionável, uma página que agrega tudo que já se sabe sobre ela" descreve exatamente o problema que o roadmap da Fase 1 já cobria parcialmente (Relacionamentos + Tags aparecem hoje na própria página de detalhe de cada entidade). O valor real do Context Engine (`modules/intelligence/context-engine/queries.ts`, painel `/campaigns/[campaignId]/context/[type]/[id]`) não está em repetir o que a ficha de cada entidade já mostra — está em fazer isso **para qualquer um dos 12 tipos de `RelatableEntityType` com uma única UI**, e em somar uma referência cruzada que **nenhuma outra página do app mostra hoje**:

- **`getEntityContext`** busca, em paralelo: (1) os dados próprios da entidade (`loadSubject`, um `switch` de 12 `case`s que chama o `get<Entidade>ForUser` que cada módulo já tinha desde sua própria fase — não uma query nova por tipo), normalizados num formato comum (`ContextSubject`: nome/subtítulo/badges/campos preenchidos/tags); (2) `listRelationshipsForEntity` (Fase 1, sem alteração); (3) parentescos via `listFamilyRelationsForNpc`/`groupFamilyRelationsForNpc` (Fase 5), só quando `type === "NPC"`; (4) **`findCluesLinkedToEntity`** (novo, uma função pequena em `worldbuilding/mysteries/queries.ts`) — o inverso de `resolveClueLinks` (seção 16.4): dado uma entidade, quais Pistas de Mistério apontam para ela. Hoje isso não aparece em NENHUM lugar — abrir o NPC "Franz" não mostra que uma pista do Mistério "Quem matou o mercador?" o cita; só abrir o Mistério mostra o vínculo saindo dele. Essa é a peça que faz o Context Engine ser mais que "a mesma ficha de novo".
- **"Dados próprios" é um resumo, não uma cópia do formulário.** Os 12 tipos têm formatos de dados muito diferentes (NPC tem 7 campos de texto longo; Missão tem status+objetivo+recompensa; Mistério tem uma lista de Pistas). Em vez de reimplementar a exibição completa de cada um (12 variantes de UI, todas já existindo nas páginas de detalhe reais), o painel mostra os campos preenchidos + badges de status/visibilidade + (quando existem) atributos de Monstro/Pistas de Mistério, e um link "Ficha completa" para a página de detalhe de verdade — que continua sendo o lugar de editar. Isso evita duplicar lógica de exibição sem perder a essência do "raio-x".
- **Seletor reaproveita infraestrutura existente.** `EntityContextPicker` (tipo + busca) chama `searchRelatableEntitiesAction`, a mesma Server Action que já existe desde a Fase 1 para o seletor de alvo de Relacionamentos (`RelationshipTargetPicker`) — zero query nova de busca.

### 18.3 Campaign Health: listas categorizadas com limiar explícito, nunca uma pontuação numérica

O roadmap pedia heurísticas honestas, e deu exemplos concretos (Missões paradas, Tramas dormentes, conteúdo preso em rascunho, órfãos, arquivado vs. ativo) sem pedir uma nota consolidada. Optamos deliberadamente por **não** inventar um "Health Score" de 0 a 100 — qualquer fórmula desse tipo (ex.: "10 pontos por trama dormente, -5 por conteúdo órfão...") seria um número que parece objetivo mas esconde pesos arbitrários que ninguém pediu, e uma campanha "saudável" para um mestre (poucas tramas ativas, ritmo lento de propósito) pareceria "doente" para outro. Uma lista categorizada ("isto está dormente há X dias") é uma afirmação verificável; uma pontuação é uma opinião disfarçada de métrica. `modules/intelligence/health/queries.ts` expõe seis heurísticas independentes, cada uma um `STALE_DAYS = 30` fixo e documentado (não configurável nesta fase — um campo de configuração por campanha seria a evolução natural se o limiar de 30 dias se provar errado na prática, mas não há pedido real para isso ainda):

- Missões `ACTIVE` sem edição há mais de 30 dias.
- Tramas `DORMANT` (sem limiar de tempo — o próprio status já diz "parada").
- Mistérios `OPEN` sem edição há mais de 30 dias.
- Conteúdo com `canonStatus` `DRAFT`/`PROPOSED` há mais de 30 dias, nos 7 tipos que têm esse eixo.
- **Conteúdo órfão** — nenhuma linha em `Relationship` menciona a entidade (nos 12 `RelatableEntityType`, não arquivados). A implementação busca TODAS as linhas de `Relationship` da campanha **uma vez** (um `Set` de `"TIPO:id"` visto) e cruza contra os IDs de cada tipo em memória — nunca uma query de contagem por entidade, que seria N+1 numa campanha com centenas de itens.
- Proporção arquivado/ativo por tipo, cobrindo os 17 tipos de `ARCHIVABLE_ENTITY_TYPES` (seção 18.6) — um `Promise.all` de 34 `count()` (ativo+arquivado por tipo), não 17 queries que já trariam as duas contagens (Prisma não tem um "count agrupado por boolean" mais barato que dois `count()` aqui, dado que cada tipo é uma tabela diferente).

### 18.4 Content Graveyard: despachante fino sobre as actions que já existem, não uma nova exclusão segura

O requisito ("lugar único para revisar/limpar conteúdo arquivado") não precisa de lógica de arquivamento nova — os 16 tipos com campo `archived` (todo `ContentEntityType` da seção 18.6) já tinham `toggle*ArchivedAction` e `delete*Action` desde a fase que os criou (confirmado por grep antes de escrever qualquer código: todos os 16 já existiam — nenhum precisou ser criado). `modules/intelligence/graveyard/actions.ts` é por isso só um `switch` que decide qual action já existente chamar a partir do `type`; a checagem de permissão, a limpeza transacional de `Relationship`s e regras especiais (ex.: `deleteLocationAction` recusa apagar um Local com filhos, seção 12.4) continuam vivendo exclusivamente no módulo original de cada entidade — o Graveyard nunca duplica essa lógica.

Duas consequências assumidas, ambas documentadas em vez de "corrigidas" com complexidade extra:

- **Excluir a partir do Graveyard redireciona para a lista daquele tipo, não de volta ao Graveyard.** `delete*Action` sempre termina com `redirect(/campaigns/:id/<tipo>)` — esse é o comportamento de sempre dessas actions quando chamadas da própria página de detalhe da entidade, e o Graveyard reaproveita a action tal como ela é. Criar uma segunda versão "sem redirect" só para este painel seria exatamente o tipo de duplicação que a Fase 7 evita; o mestre volta ao Graveyard com um clique a mais no menu.
- **Restaurar (desarquivar) exigiu um `router.refresh()` explícito no componente cliente.** `toggle*ArchivedAction` só chama `revalidatePath` para a lista/detalhe daquela entidade (ex. `/campaigns/:id/factions`) — ela não tem por que saber que uma página `/graveyard` existe em cima dela. Sem isso, o item restaurado "gruda" visualmente na lista do Graveyard até a próxima navegação completa (o Router Cache do Next.js do lado do cliente não sabia que precisava buscar `/graveyard` de novo) — o mesmo tipo de dessincronia do Router Cache já documentado na seção 13.6, mas aqui com uma causa mais simples (nenhum `revalidatePath` cobria a rota) e uma correção direta, sem precisar investigar mais fundo: `GraveyardItemRow` chama `router.refresh()` depois de `await`ar a action de restaurar.

### 18.5 Bug pré-existente descoberto: checkbox desmarcado quebrava criar Monstro comum e faixa de áudio sem loop

Durante o teste end-to-end desta fase (criar um Monstro pelo formulário de verdade, não direto no banco), `createMonsterAction` falhava silenciosamente sempre que o checkbox "É um chefe (Boss)" ficava **desmarcado** — ou seja, no caso mais comum (a maioria dos monstros não é chefe). A causa: um `<input type="checkbox">` HTML desmarcado não aparece no `FormData` como `false`, mas como **ausente**, e `formData.get("isBoss")` retorna `null` nesse caso (não `undefined`) — enquanto `monsterFormSchema` tinha `isBoss: z.string().optional()`, que só trata `undefined` como "campo ausente" e rejeita `null` como um valor de tipo errado (`"Invalid input: expected string, received null"`). O formulário de Monstro só mostrava erro visível para o campo `name`, então a falha de validação era invisível para o usuário: o formulário simplesmente "não fazia nada" ao submeter.

Uma busca por todo `type="checkbox"` do projeto achou o mesmo padrão em `AudioTrack.loop` (`audioTrackFormSchema`, Fase 4) — só não se manifestava com a mesma frequência porque o checkbox de loop vem **marcado por padrão** (a maioria das faixas de música realmente re-toca em loop), então só desmarcá-lo para criar um efeito sonoro avulso (SFX, que tipicamente não deveria repetir) expunha o mesmo bug. Os outros dois checkboxes do projeto (`Clue.discovered`, `ChecklistItem.done`) não usam esse padrão de criação-via-FormData — são alternados por uma action dedicada que lê o valor atual do banco e inverte, sem passar por Zod, então não tinham o problema.

Corrigido normalizando a leitura de ambos os campos para `formData.get(campo) || undefined` antes de validar (transforma `null` em `undefined`, preserva `"on"` quando marcado) — a correção mínima, sem mudar o schema ou a lógica que já lê `=== "on"` depois. Isso pré-existia desde a Fase 6 (`isBoss`) e a Fase 4 (`loop`); nenhuma das duas fases tinha testado criar esse tipo de conteúdo com o checkbox desmarcado antes.

### 18.6 `ContentEntityType`: um universo mais amplo que `RelatableEntityType`, só para as features que precisam dele

Três das quatro sub-features (Brain, Health, Graveyard) precisam enxergar **todo** conteúdo arquivável da campanha — não só os 12 tipos de `RelatableEntityType` (que participam do sistema de Relacionamentos), mas também Ideias, Relógios Narrativos, Tabelas de Rolagem (Table Builder e Loot Generator contam como dois tipos de UI, mesmo sendo o mesmo modelo `RollTable` com `kind` diferente — seção 17.3) e Sessões de preparação — conteúdo real da campanha que ficou de fora de `RelatableEntityType` por razões já documentadas (seções 12.1, 13.5, 16.2, 17.3): não têm página de detalhe própria para linkar de volta, ou são ferramentas de mesa do mestre, não conteúdo compartilhável da wiki.

Em vez de forçar esses 5 tipos extras para dentro de `RelatableEntityType` (o que exigiria dar a Ideias/Relógios uma página de detalhe só para satisfazer um enum, ou fingir que uma Tabela de Rolagem pode ser o alvo de um Relacionamento, quando a seção 17.3 já decidiu que não faz sentido), `modules/intelligence/content-types.ts` define `ContentEntityType = RelatableEntityType | "IDEA" | "NARRATIVE_CLOCK" | "ROLL_TABLE_GENERIC" | "ROLL_TABLE_LOOT" | "SESSION_PLAN"` — um tipo maior, só para as três features que genuinamente precisam de "todo conteúdo", com seus próprios mapas de label/ícone/rota (reaproveitando `ENTITY_TYPE_LABELS`/`ENTITY_TYPE_ICONS`/`ENTITY_TYPE_PATH` de `relationships/config.ts` via spread, mais as 5 entradas extras). O Context Engine continua usando `RelatableEntityType` puro — ele é sobre relações, então o universo menor é o correto para ele, não uma limitação a contornar.

## 19. Roadmap de fases

| Fase | Escopo |
| --- | --- |
| **0 — Fundação** ✅ | auth, campanhas, layout, PWA base, storage, sync base, permissões base |
| **1 — Wiki da campanha** ✅ | NPCs, Locais, Facções, Lore, Tags, Relacionamentos, Busca global, Command Palette, Idea Vault, Dashboard real |
| **2 — Preparação** ✅ | Session Planner, Checklist, Scene Builder, Quests, Consequências, Plot Threads |
| **3 — Modo Sessão** ✅ | Modo Sessão, Dice Roller, Session Log, Combat Tracker, Quick NPC, Panic Button — offline real prioritário aqui |
| **4 — Áudio** ✅ | Music/SFX Board, os dois bots do Discord (trilha sonora + efeitos) |
| **5 — World Building** ✅ | Timeline, Calendário, Relógios Narrativos, Family Tree, Mystery Board |
| **6 — Game Tools** ✅ | Monster/Boss/Item Forge, Power Builder, Table Builder, Loot Generator (construído sobre o Table Builder) |
| **7 — Inteligência da campanha** ✅ | Campaign Brain avançado, Context Engine, Campaign Health, Content Graveyard — 100% heurística/agregação sobre dados locais, zero IA (seção 18.0) |
| 8 — IA | Lore Guardian, Canon Checker, Campaign Recall, Consequence Suggester (sempre copiloto, nunca autoridade) |
| 9 — Jogadores | Player View, Player Knowledge, Handouts, Co-Mestres, permissões avançadas |

Cada fase começa lendo o código existente, reaproveitando `modules/core` e os componentes de `components/ui`, sem reescrever o que já funciona.
