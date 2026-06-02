/**
 * Service Worker pour la PWA
 * Gère le cache et le fonctionnement hors-ligne
 */

const CACHE_NAME = 'suivi-pam-mha-v3';
const STATIC_CACHE = [
  '/',
  '/index.html',
  '/login.html',
  '/styles.css',
  '/styles-2026.css',
  '/styles-filters.css',
  '/styles-mobile.css',
  '/notifications.css',
  '/app.js',
  '/api.js',
  '/filters.js',
  '/import-export.js',
  '/notifications.js',
  '/mobile.js',
  '/manifest.json',
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Mise en cache des fichiers statiques');
        return cache.addAll(STATIC_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[Service Worker] Suppression ancien cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de cache: Network First pour les API, Cache First pour les ressources statiques
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-HTTP/HTTPS (chrome-extension, etc.)
  if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
    return;
  }

  // Ne pas mettre en cache les requêtes API POST/PUT/DELETE
  if (request.method !== 'GET') {
    return;
  }

  // Stratégie Network First pour TOUTES les ressources same-origin
  // (HTML/CSS/JS/API toujours frais en ligne ; le cache sert de secours hors-ligne).
  // Évite de servir des assets périmés après un déploiement.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type !== 'error') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cross-origin (CDN, polices…) : cache-first au mieux
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).catch(() => cached))
  );
});

// Gestion des messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

