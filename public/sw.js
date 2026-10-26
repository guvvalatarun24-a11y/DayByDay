const CACHE_NAME = 'daybyday-shell-v1';
const SHELL_PATH = '/index.html';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith('daybyday-shell-') && cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, {cache: 'no-cache'})
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            return caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(SHELL_PATH, copy))
              .catch((error) => {
                console.error('Failed to cache the DayByDay app shell:', error);
              })
              .then(() => response);
          }
          return response;
        })
        .catch(async () => {
          const cachedShell = await caches.match(SHELL_PATH);
          if (cachedShell) {
            return cachedShell;
          }
          throw new Error('The DayByDay app shell is not available offline.');
        }),
    );
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            return caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, copy))
              .catch((error) => {
                console.error('Failed to cache a DayByDay app asset:', error);
              })
              .then(() => response);
          }
          return response;
        })
        .catch(async () => {
          const cachedAsset = await caches.match(request);
          if (cachedAsset) {
            return cachedAsset;
          }
          throw new Error(`The requested app asset is not available offline: ${url.pathname}`);
        }),
    );
  }
});
