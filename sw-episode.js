// Service Worker untuk Episode Page Caching
// Optimasi performa dengan caching strategis

const CACHE_NAME = 'renzoku-episode-v1';
const API_CACHE_NAME = 'renzoku-api-v1';

// Files to cache
const STATIC_CACHE_URLS = [
    '/pages/episode.html',
    '/styles/episode-improved.css',
    '/styles/style.css',
    '/scripts/episode-optimized.js',
    '/scripts/light-search.js'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching static files');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                console.log('Service Worker installed');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker activated');
            return self.clients.claim();
        })
    );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle API requests with cache-first strategy
    if (url.hostname === 'www.sankavollerei.com') {
        event.respondWith(
            caches.open(API_CACHE_NAME).then((cache) => {
                return cache.match(request).then((cachedResponse) => {
                    if (cachedResponse) {
                        console.log('Serving API from cache:', request.url);
                        return cachedResponse;
                    }

                    return fetch(request).then((response) => {
                        // Only cache successful responses
                        if (response.status === 200) {
                            console.log('Caching API response:', request.url);
                            cache.put(request, response.clone());
                        }
                        return response;
                    }).catch((error) => {
                        console.error('API fetch failed:', error);
                        // Return cached response if available, even if stale
                        return cachedResponse || new Response(
                            JSON.stringify({ 
                                status: 'error', 
                                message: 'Network error' 
                            }),
                            { 
                                status: 500,
                                headers: { 'Content-Type': 'application/json' }
                            }
                        );
                    });
                });
            })
        );
        return;
    }

    // Handle static files with cache-first strategy
    if (request.method === 'GET') {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('Serving static file from cache:', request.url);
                    return cachedResponse;
                }

                return fetch(request).then((response) => {
                    // Only cache successful responses
                    if (response.status === 200) {
                        console.log('Caching static file:', request.url);
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                });
            })
        );
    }
});

// Message event - handle cache invalidation
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        console.log('Clearing cache...');
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        return caches.delete(cacheName);
                    })
                );
            }).then(() => {
                console.log('Cache cleared');
                event.ports[0].postMessage({ success: true });
            })
        );
    }
});

// Background sync for failed requests
self.addEventListener('sync', (event) => {
    if (event.tag === 'episode-sync') {
        console.log('Background sync triggered');
        event.waitUntil(
            // Retry failed episode requests
            fetch('/api/retry-failed-requests')
                .then((response) => {
                    console.log('Background sync completed');
                })
                .catch((error) => {
                    console.error('Background sync failed:', error);
                })
        );
    }
});

// Push notification for episode updates
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey
            },
            actions: [
                {
                    action: 'explore',
                    title: 'Lihat Episode',
                    icon: '/checkmark.png'
                },
                {
                    action: 'close',
                    title: 'Tutup',
                    icon: '/xmark.png'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/pages/episode.html')
        );
    }
});

console.log('Service Worker loaded');
