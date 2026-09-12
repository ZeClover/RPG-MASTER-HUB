# Arquitetura — RPG Master Hub

Este documento registra as decisões técnicas da Fase 0 e o roadmap de fases. Antes de iniciar qualquer fase nova, leia este arquivo e o `README.md`.

## 1. Arquitetura

Aplicação **única** Next.js (App Router), não um monorepo. O motivo: os bots do Discord (Fase 4) precisam de um processo Node persistente, mas não existe código de bot ainda — criar um monorepo agora só para acomodar algo que não existe adicionaria complexidade sem benefício (ver "Bots" abaixo).

Dentro do app, o código se organiza em duas dimensões:

- **`app/`** — apenas rotas. Layouts e páginas são finos: buscam sessão/dados via `modules/`, e delegam toda a lógica de domínio.
- **`modules/<domínio>/<entidade>/`** — a lógica de negócio de verdade: `schemas.ts` (Zod), `actions.ts` (Server Actions), `queries.ts` (leituras). Mapeia diretamente para os domínios do briefing (CORE, CREATION, STORY, GAME, MEDIA, AUDIO, INTELLIGENCE, PLAYER).

Até a Fase 0 só existia o módulo `core` (`auth`, `campaigns`, `permissions`). A Fase 1 introduziu o domínio `creation`: `modules/creation/<entidade>/` para cada tipo de conteúdo (NPCs, Locais, Facções, Lore, Ideias) mais dois módulos transversais que várias entidades compartilham (`tags`, `relationships`). A Fase 2 introduziu o domínio `preparation` (Sessões, Missões, Tramas, Consequências) — mapeando diretamente para o domínio PREP do briefing original, análogo em estrutura a `creation` mas com seu próprio conjunto de entidades e regras de negócio. Os domínios ainda não usados (GAME, MEDIA, AUDIO, INTELLIGENCE, PLAYER) continuam sem pasta — mesma regra da Fase 0, pastas vazias não têm valor.

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
    api/
      auth/[...nextauth]/                 — handlers do Auth.js
      v1/uploads/                         — upload de imagens (autenticado)
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
  lib/
    db.ts          — client Prisma singleton
    auth.ts        — config do Auth.js
    storage/       — abstração de upload (local | Vercel Blob)
    sync-store.ts  — estado de sincronização (Zustand), estendido na Fase 3 com contagem de escritas pendentes
    dice.ts         — parser/roller de notação de dados, puro (Fase 3)
    offline-queue.ts — fila de escrita offline em IndexedDB (Fase 3, ver seção 14.1)
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

Um único helper, `requireCampaignAccess(userId, campaignId, minRole?)`, usado por toda action/rota que toca dado de campanha — nunca a UI sozinha decide o que é permitido (seção 12.7 detalha o padrão de exclusão segura que depende disso). Na Fase 0 só o papel `OWNER` existia de fato; a partir da Fase 1 o ranking `OWNER > CO_GM > PLAYER` já é aplicado de verdade: toda criação/edição/exclusão de conteúdo exige `CO_GM` (o padrão do parâmetro `minRole` é `PLAYER`, suficiente para leitura). A UI para promover alguém a `CO_GM`/`PLAYER` (convites) ainda não existe — isso é Fase 9 — mas a checagem de papel já está pronta para quando existir. Visibilidade por conteúdo (`GM_ONLY`/`PLAYERS`/`PUBLIC`) chegou na Fase 1 como campo nas entidades de conteúdo (NPCs, Locais, Facções, Lore); ainda não há um "Player View" (Fase 9) que efetivamente filtre por ela — hoje o campo só é exibido como metadado.

## 10. Bots do Discord (preparação, não implementação)

Nenhum código de bot nesta fase (é item de Fase 4). Arquitetura prevista: um processo Node separado e persistente (fora da Vercel — funções serverless não sustentam conexão de voz), rodando `discord.js`, autenticado contra a API do hub via um secret de serviço (rota futura `/api/v1/bot/*`, nunca via sessão de usuário). O token do Discord nunca passa perto do frontend.

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

## 15. Roadmap de fases

| Fase | Escopo |
| --- | --- |
| **0 — Fundação** ✅ | auth, campanhas, layout, PWA base, storage, sync base, permissões base |
| **1 — Wiki da campanha** ✅ | NPCs, Locais, Facções, Lore, Tags, Relacionamentos, Busca global, Command Palette, Idea Vault, Dashboard real |
| **2 — Preparação** ✅ | Session Planner, Checklist, Scene Builder, Quests, Consequências, Plot Threads |
| **3 — Modo Sessão** ✅ | Modo Sessão, Dice Roller, Session Log, Combat Tracker, Quick NPC, Panic Button — offline real prioritário aqui |
| 4 — Áudio | Music/SFX Board, Presets, os dois bots do Discord |
| 5 — World Building | Timeline, Calendário, Relógios Narrativos, Family Tree, Mystery Board |
| 6 — Game Tools | Monster/Boss/Item Forge, Power Builder, Loot Generator, Table Builder |
| 7 — Inteligência da campanha | Campaign Brain avançado, Context Engine, Campaign Health, Content Graveyard |
| 8 — IA | Lore Guardian, Canon Checker, Campaign Recall, Consequence Suggester (sempre copiloto, nunca autoridade) |
| 9 — Jogadores | Player View, Player Knowledge, Handouts, Co-Mestres, permissões avançadas |

Cada fase começa lendo o código existente, reaproveitando `modules/core` e os componentes de `components/ui`, sem reescrever o que já funciona.
