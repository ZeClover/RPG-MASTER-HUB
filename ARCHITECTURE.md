# Arquitetura — RPG Master Hub

Este documento registra as decisões técnicas da Fase 0 e o roadmap de fases. Antes de iniciar qualquer fase nova, leia este arquivo e o `README.md`.

## 1. Arquitetura

Aplicação **única** Next.js (App Router), não um monorepo. O motivo: os bots do Discord (Fase 4) precisam de um processo Node persistente, mas não existe código de bot ainda — criar um monorepo agora só para acomodar algo que não existe adicionaria complexidade sem benefício (ver "Bots" abaixo).

Dentro do app, o código se organiza em duas dimensões:

- **`app/`** — apenas rotas. Layouts e páginas são finos: buscam sessão/dados via `modules/`, e delegam toda a lógica de domínio.
- **`modules/<domínio>/<entidade>/`** — a lógica de negócio de verdade: `schemas.ts` (Zod), `actions.ts` (Server Actions), `queries.ts` (leituras). Mapeia diretamente para os domínios do briefing (CORE, CREATION, STORY, GAME, MEDIA, AUDIO, INTELLIGENCE, PLAYER).

Até a Fase 0 só existia o módulo `core` (`auth`, `campaigns`, `permissions`). A Fase 1 introduziu o domínio `creation`: `modules/creation/<entidade>/` para cada tipo de conteúdo (NPCs, Locais, Facções, Lore, Ideias) mais dois módulos transversais que várias entidades compartilham (`tags`, `relationships`). Os domínios ainda não usados (STORY, GAME, MEDIA, AUDIO, INTELLIGENCE, PLAYER) continuam sem pasta — mesma regra da Fase 0, pastas vazias não têm valor.

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
    api/
      auth/[...nextauth]/                 — handlers do Auth.js
      v1/uploads/                         — upload de imagens (autenticado)
    manifest.ts, offline/
  modules/
    core/
      auth/        — schemas, actions (register/login/logout), sessão
      campaigns/   — schemas, actions, queries
      permissions/ — requireCampaignAccess (único ponto de checagem de papel)
      search/      — busca global (Fase 1): queries cross-entidade + action
      dashboard/   — queries agregadas do dashboard (Fase 1)
    creation/
      npcs/, locations/, factions/, lore/, ideas/  — schemas, actions, queries de cada entidade (Fase 1)
      tags/          — slug/dedup, actions, queries (Fase 1)
      relationships/ — associação polimórfica entre entidades (Fase 1, ver seção 13)
      wiki-filters.ts — tipo `WikiListFilters` compartilhado (q/tag/status/favorite/archived)
  components/
    ui/            — primitivas (Button, Card, Dialog, DropdownMenu, Tooltip, Avatar, Select, Popover...)
    layout/        — topbar, sidebar de campanha, menu de usuário
    campaigns/     — formulário de campanha, upload de imagem, card
    providers/     — QueryProvider, ConnectivityListener, ServiceWorkerRegister
    wiki/          — componentes reaproveitados por todas as entidades de conteúdo (Fase 1): badges de
                     status/visibilidade, tag picker, card/grid genéricos, painel de relacionamentos,
                     command palette, markdown viewer
    npcs/, locations/, factions/, lore/, ideas/ — formulários e widgets específicos de cada entidade (Fase 1)
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

`CampaignMember` já modela multi-usuário mesmo sem UI de convite: a criação de campanha só atribui o papel `OWNER` (automaticamente, ao dono). O enum `CampaignRole` (`OWNER`/`CO_GM`/`PLAYER`) e o ranking de acesso em `requireCampaignAccess` já são usados de verdade desde a Fase 1 — toda criação/edição/exclusão de conteúdo (NPCs, Locais, Facções, Lore, Ideias, Tags, Relacionamentos) exige `CO_GM` como papel mínimo, mesmo sem existir ainda uma tela para promover alguém a `CO_GM`/`PLAYER` (isso é a UI de convite da Fase 9) — os testes de permissão inserem a membership direto no banco para validar a regra hoje.

### Nota sobre Prisma 7

O gerador mudou de `prisma-client-js` para `prisma-client`: o client gerado vai para `src/generated/prisma` (git-ignorado, gerado no `postinstall`) em vez de dentro de `node_modules`, é ESM e **não lê mais `DATABASE_URL` implicitamente em runtime** — o `PrismaClient` exige um driver adapter explícito. Por isso `src/lib/db.ts` usa `@prisma/adapter-pg` (`new PrismaPg(connectionString)`) para o client de runtime; o `prisma7.config.ts` (usado pela CLI para migrations/introspection) é configurado separadamente e aponta para a mesma `DATABASE_URL`.

### Modelo de dados (Fase 1)

```
Npc, Location, Faction, LorePage   — entidades de conteúdo. Campos comuns: campaignId, nome/título,
                                      canonStatus (DRAFT|CANON|DEPRECATED), archived, favorite,
                                      visibility (MASTER_ONLY|PLAYERS|PUBLIC), timestamps
Location.parentLocationId          — auto-relação (hierarquia), onDelete: Restrict (seção 12.4)
Idea                                — captura rápida; só título é obrigatório; sem canonStatus/visibility
                                      (é pré-canônico por natureza — ver 12.2)
Tag, NpcTag, LocationTag,
FactionTag, LorePageTag, IdeaTag   — tag por campanha (slug único) + 5 junções 1:1 por tipo (seção 12.3)
Relationship                       — sourceType/sourceId + targetType/targetId (RelatableEntityType:
                                      NPC|LOCATION|FACTION|LORE_PAGE) + type/description/importance/
                                      visibility; sem FK de banco (associação polimórfica, seção 12.1)
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

`app/manifest.ts` (convenção nativa do App Router) + `public/sw.js` escrito à mão: cacheia uma página `/offline` no install, e no evento `fetch` só intercepta navegações (`request.mode === "navigate"`), tentando rede primeiro e caindo para `/offline` se falhar. Instalável em desktop/Android/iOS. Cache agressivo de dados de campanha para uso offline real é da Fase 3 (Modo Sessão) — a Fase 0 só entrega a fundação (manifest + SW + fallback), não decisões de cache por entidade que ainda não existem.

## 8. Sincronização

Os dados nunca ficam presos ao dispositivo: tudo passa pelo Postgres via Server Actions/API, não por `localStorage`. `useSyncStore` (Zustand) guarda um status (`synced | saving | pending | offline | error`) exibido na topbar; hoje é alimentado apenas por `navigator.onLine` — fila de escrita offline e resolução de conflito (dispositivo A/B editando a mesma campanha) chegam com o Modo Sessão (Fase 3), que é onde a sincronização realmente importa. Não fingimos um status "salvo" que não reflete nada real.

## 9. Permissões

Um único helper, `requireCampaignAccess(userId, campaignId, minRole?)`, usado por toda action/rota que toca dado de campanha — nunca a UI sozinha decide o que é permitido (seção 12.7 detalha o padrão de exclusão segura que depende disso). Na Fase 0 só o papel `OWNER` existia de fato; a partir da Fase 1 o ranking `OWNER > CO_GM > PLAYER` já é aplicado de verdade: toda criação/edição/exclusão de conteúdo exige `CO_GM` (o padrão do parâmetro `minRole` é `PLAYER`, suficiente para leitura). A UI para promover alguém a `CO_GM`/`PLAYER` (convites) ainda não existe — isso é Fase 9 — mas a checagem de papel já está pronta para quando existir. Visibilidade por conteúdo (`MASTER_ONLY`/`PLAYERS`/`PUBLIC`) chegou na Fase 1 como campo nas entidades de conteúdo (NPCs, Locais, Facções, Lore); ainda não há um "Player View" (Fase 9) que efetivamente filtre por ela — hoje o campo só é exibido como metadado.

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

Toda entidade de conteúdo tem **dois** campos de estado, deliberadamente não fundidos em um só:

- `CanonStatus` (`DRAFT | CANON | DEPRECATED`) — o eixo **narrativo**: o quão "oficial" essa informação é dentro da campanha (um rascunho de NPC que ainda pode mudar, um NPC já estabelecido em jogo, ou algo que foi substituído pela narrativa e não vale mais).
- `archived: boolean` — o eixo **organizacional/de UI**: está fora da visão principal (lista padrão não mostra), mas continua existindo e canônico.

São independentes porque um NPC pode ser `CANON` e `archived` (ex.: morreu na sessão passada — ainda é verdade estabelecida da campanha, só não precisa aparecer na lista do dia a dia) ou `DRAFT` e não-arquivado (uma ideia de NPC ainda sendo lapidada, mas ativa). Fundir os dois exigiria um enum com 6 estados (`DRAFT`, `DRAFT_ARCHIVED`, `CANON`, `CANON_ARCHIVED`, ...) para cobrir a mesma matriz, sem ganho.

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

## 13. Roadmap de fases

| Fase | Escopo |
| --- | --- |
| **0 — Fundação** ✅ | auth, campanhas, layout, PWA base, storage, sync base, permissões base |
| **1 — Wiki da campanha** ✅ | NPCs, Locais, Facções, Lore, Tags, Relacionamentos, Busca global, Command Palette, Idea Vault, Dashboard real |
| 2 — Preparação | Session Planner, Checklist, Scene Builder, Quests, Consequências, Plot Threads |
| 3 — Modo Sessão | Modo Sessão, Dice Roller, Session Log, Combat Tracker, Quick NPC, Panic Button — offline real prioritário aqui |
| 4 — Áudio | Music/SFX Board, Presets, os dois bots do Discord |
| 5 — World Building | Timeline, Calendário, Relógios Narrativos, Family Tree, Mystery Board |
| 6 — Game Tools | Monster/Boss/Item Forge, Power Builder, Loot Generator, Table Builder |
| 7 — Inteligência da campanha | Campaign Brain avançado, Context Engine, Campaign Health, Content Graveyard |
| 8 — IA | Lore Guardian, Canon Checker, Campaign Recall, Consequence Suggester (sempre copiloto, nunca autoridade) |
| 9 — Jogadores | Player View, Player Knowledge, Handouts, Co-Mestres, permissões avançadas |

Cada fase começa lendo o código existente, reaproveitando `modules/core` e os componentes de `components/ui`, sem reescrever o que já funciona.
