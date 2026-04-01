/**
 * NeuroPlex — Service Worker
 * Cache-first strategy. All app files cached on install.
 * Update CACHE_NAME when deploying new versions.
 */

const CACHE_NAME = 'neuroplex-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles/main.css',
  '/styles/exercises.css',
  '/data/activities.js',
  '/js/core.js',
  '/js/exercises/schulte.js',
  '/js/exercises/maze.js',
  '/js/exercises/memory-grid.js',
  '/js/exercises/rsvp.js',
  '/js/exercises/focus-training.js',
  '/js/exercises/peripheral.js',
  '/js/exercises/gorilla.js',
  '/js/exercises/stroop.js',
  '/js/exercises/reverse-recall.js',
  '/js/exercises/dual-hand.js',
  '/js/exercises/bimanual.js',
  '/js/exercises/blindfold.js',
  '/js/exercises/stationary-focus.js',
  '/activities/schulte.html',
  '/activities/maze.html',
  '/activities/memory-grid.html',
  '/activities/rsvp.html',
  '/activities/focus-training.html',
  '/activities/peripheral.html',
  '/activities/gorilla.html',
  '/activities/stroop.html',
  '/activities/reverse-recall.html',
  '/activities/dual-hand.html',
  '/activities/bimanual.html',
  '/activities/blindfold.html',
  '/activities/stationary-focus.html'
];

/* ── Install — cache everything ─────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate — delete old caches ───────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch — cache first, network fallback ──────────────── */
self.addEventListener('fetch', event => {
  /* Only handle GET requests */
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;

        return fetch(event.request)
          .then(response => {
            /* Cache valid responses */
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => {
            /* Offline fallback — serve index.html for navigation */
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});