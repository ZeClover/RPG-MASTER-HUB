// Service worker: garante instalabilidade do PWA, um fallback offline para
// navegação em geral, e (Fase 3) um cache "network-first" específico para a
// página do Modo Sessão — a única tela pensada para continuar usável com a
// conexão caindo no meio de uma sessão. Não tentamos cache agressivo do
// resto do app: as demais páginas (NPCs, Locais, Missões...) são de
// preparação, usadas antes/depois da mesa, não durante — perder a conexão
// nelas só significa "recarregue quando a internet voltar", o que é honesto
// sobre o que este SW realmente garante.
const CACHE_NAME = "rpg-master-hub-shell-v2";
const OFFLINE_URL = "/offline";
const SESSION_MODE_PATTERN = /^\/campaigns\/[^/]+\/session(\?.*)?$/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll([OFFLINE_URL]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.mode !== "navigate") return;

  const path = new URL(request.url).pathname + new URL(request.url).search;
  const isSessionMode = SESSION_MODE_PATTERN.test(path);

  if (isSessionMode) {
    // Network-first: sempre busca a versão mais nova quando há conexão (o
    // Modo Sessão tem dados ao vivo), e só cai para o último snapshot em
    // cache — não para /offline — quando a rede falha, já que reabrir a
    // sessão com o estado da última vez que esteve online é bem mais útil
    // para o mestre no meio da mesa do que uma tela genérica de "sem conexão".
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached ?? caches.match(OFFLINE_URL))),
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(OFFLINE_URL).then((res) => res ?? Response.error())),
  );
});
