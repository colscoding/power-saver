/**
 * Service Worker for Power Meter PWA
 * Handles caching and offline functionality
 */

// Use build timestamp to create unique cache names for each deployment
const BUILD_VERSION = '__BUILD_VERSION__'; // Will be replaced during build
const CACHE_VERSION = BUILD_VERSION || Date.now().toString();
const STATIC_CACHE = `power-meter-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `power-meter-dynamic-${CACHE_VERSION}`;

// Files to cache on install
const STATIC_ASSETS = [
    './',
    './index.html',
    // Note: Parcel will bundle and hash the actual JS/CSS files
    // These will be cached dynamically on first fetch
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Skip waiting');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Installation failed:', error);
            })
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete any cache that doesn't match current version
                        if (cacheName.startsWith('power-meter-') &&
                            cacheName !== STATIC_CACHE &&
                            cacheName !== DYNAMIC_CACHE) {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Claiming clients');
                return self.clients.claim();
            })
    );
});

/**
 * Fetch event - serve from cache, fallback to network
 * Strategy: Network First for HTML, Cache First for other assets
 */
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http requests
    if (!event.request.url.startsWith('http')) {
        return;
    }

    const url = new URL(event.request.url);
    const isHTMLRequest = event.request.headers.get('accept')?.includes('text/html') ||
        url.pathname.endsWith('.html') ||
        url.pathname === '/' ||
        url.pathname === '/index.html';

    // Use Network First strategy for HTML to ensure fresh content
    if (isHTMLRequest) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache the fresh HTML
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(STATIC_CACHE)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(event.request)
                        .then((cachedResponse) => {
                            if (cachedResponse) {
                                console.log('[Service Worker] Serving HTML from cache (offline):', event.request.url);
                                return cachedResponse;
                            }
                            return caches.match('./index.html');
                        });
                })
        );
        return;
    }

    // Use Cache First strategy for other assets (CSS, JS, images)
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('[Service Worker] Serving from cache:', event.request.url);
                    return cachedResponse;
                }

                // Clone the request because it can only be used once
                return fetch(event.request.clone())
                    .then((response) => {
                        // Check if valid response
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        // Clone the response because it can only be used once
                        const responseToCache = response.clone();

                        // Cache the fetched response for future use
                        caches.open(DYNAMIC_CACHE)
                            .then((cache) => {
                                console.log('[Service Worker] Caching new resource:', event.request.url);
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Fetch failed:', error);

                        // Return a custom offline page if available
                        return caches.match('./index.html');
                    });
            })
    );
});

/**
 * Message event - handle messages from clients
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    // Allow clients to clear cache
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName.startsWith('power-meter-')) {
                            console.log('[Service Worker] Clearing cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }).then(() => {
                console.log('[Service Worker] All caches cleared');
                // Notify all clients
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({ type: 'CACHE_CLEARED' });
                    });
                });
            })
        );
    }
});
