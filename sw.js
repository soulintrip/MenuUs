// sw.js — положить рядом с html-файлом (тот же каталог). Нужен HTTPS или localhost.
const VER = 'menu-v2';          // менять при каждом обновлении приложения
const CORE = ['./'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VER).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VER).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // Страница: сначала сеть (чтобы обновления приходили), офлайн — из кэша
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(VER).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./')))
    );
    return;
  }

  // Остальное: из кэша, иначе сеть с докладыванием в кэш
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(VER).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});
