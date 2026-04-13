/**
 * NeuroPlex — Service Worker
 * Cache-first. Works on GitHub Pages at /NeuroPlex/ subdirectory.
 * Bump CACHE_NAME to 'neuroplex-v2' when pushing updates.
 */

const CACHE_NAME = 'neuroplex-v1';
const BASE       = '/NeuroPlex';

const PRECACHE_URLS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/styles/main.css',
  BASE + '/styles/exercises.css',
  BASE + '/data/activities.js',
  BASE + '/js/core.js',
  BASE + '/js/exercises/schulte.js',
  BASE + '/js/exercises/maze.js',
  BASE + '/js/exercises/memory-grid.js',
  BASE + '/js/exercises/rsvp.js',
  BASE + '/js/exercises/focus-training.js',
  BASE + '/js/exercises/peripheral.js',
  BASE + '/js/exercises/gorilla.js',
  BASE + '/js/exercises/stroop.js',
  BASE + '/js/exercises/reverse-recall.js',
  BASE + '/js/exercises/dual-hand.js',
  BASE + '/js/exercises/bimanual.js',
  BASE + '/js/exercises/blindfold.js',
  BASE + '/js/exercises/stationary-focus.js',
  BASE + '/activities/schulte.html',
  BASE + '/activities/maze.html',
  BASE + '/activities/memory-grid.html',
  BASE + '/activities/rsvp.html',
  BASE + '/activities/focus-training.html',
  BASE + '/activities/peripheral.html',
  BASE + '/activities/gorilla.html',
  BASE + '/activities/stroop.html',
  BASE + '/activities/reverse-recall.html',
  BASE + '/activities/dual-hand.html',
  BASE + '/activities/bimanual.html',
  BASE + '/activities/blindfold.html',
  BASE + '/activities/stationary-focus.html'
];

/* ── Install ─────────────────────────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate — delete old caches ────────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch — cache first, network fallback ───────────────── */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match(BASE + '/index.html');
        }
      });
    })
  );
});
