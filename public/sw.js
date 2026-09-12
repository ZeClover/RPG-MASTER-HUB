// Service worker mínimo da Fase 0: só garante instalabilidade do PWA e um
// fallback offline para navegação. Cache de dados de campanha para uso
// offline real (NPCs, cenas, missões) é construído na Fase 3 (Modo Sessão).
const CACHE_NAME = "rpg-master-hub-shell-v1";
const OFFLINE_URL = "/offline";

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

  event.respondWith(
    fetch(request).catch(() => caches.match(OFFLINE_URL).then((res) => res ?? Response.error())),
  );
});
