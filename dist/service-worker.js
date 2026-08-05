const CACHE_PREFIX = "colorquest-";
const VERSION = `${CACHE_PREFIX}v2.4`;
const BASE = self.registration.scope;
const STORY_IDS = ["pips-hat", "moons-sock", "turtles-fast-day", "banana-boots", "polite-volcano", "bubble-bus"];
const STORY_IMAGES = STORY_IDS.flatMap((story) =>
  [1, 2, 3, 4].map((page) => `${BASE}stories/${story}-${page}.webp`),
);
const SHELL = [
  BASE,
  `${BASE}index.html`,
  `${BASE}manifest.webmanifest`,
  `${BASE}assets/app.js`,
  `${BASE}assets/app.css`,
  `${BASE}hero-production.png`,
  `${BASE}icon.svg`,
  `${BASE}icon-192.png`,
  `${BASE}icon-512.png`,
  ...STORY_IMAGES,
];
const SHELL_URLS = new Set(SHELL.map((url) => new URL(url, BASE).href));

self.addEventListener("install", (event) => {
  // Asset names are deliberately stable. Force a network revalidation during
  // installation so the new versioned cache cannot inherit an old app.js or
  // app.css response from the browser's HTTP cache.
  event.waitUntil(
    caches.open(VERSION).then((cache) =>
      cache.addAll(SHELL.map((url) => new Request(url, { cache: "reload" }))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== VERSION)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Never copy third-party responses into a child's offline cache. Core
  // ColorQuest content is local; grown-up-approved links open separately.
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(VERSION).then((cache) => cache.put(`${BASE}index.html`, copy)));
          }
          return response;
        })
        .catch(() => caches.match(`${BASE}index.html`)),
    );
    return;
  }

  // The complete offline shell is pre-cached. Avoid an unbounded runtime
  // cache by leaving every other same-origin request to the network.
  if (!SHELL_URLS.has(url.href)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  );
});
