/**
 * Service Worker cho Source Computer PWA
 * Hỗ trợ: Offline mode, Cache strategies, Push notifications
 * 
 * CACHE STRATEGIES:
 * - Static assets: Cache First (CSS, JS, Images)
 * - API calls: Network First với cache fallback
 * - HTML pages: Stale While Revalidate
 */

const CACHE_NAME = 'sourcecomputer-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Assets cần cache ngay khi install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/css/style.css',
  '/css/admin.css',
  '/js/main.js',
  '/js/pwa.js',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap'
];

// Patterns để xác định loại request
const CACHE_PATTERNS = {
  static: /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i,
  api: /\/(api|auth|cart|order|products\/.*\/review)/i,
  page: /^https?:\/\/[^\/]+\/?(?!api|uploads|icons)[^\.]*$/i
};

// ============================================
// INSTALL EVENT - Pre-cache essential assets
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching essential assets');
        // Cache từng file riêng để tránh lỗi nếu 1 file fail
        return Promise.allSettled(
          PRECACHE_ASSETS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`[SW] Failed to cache: ${url}`, err);
            })
          )
        );
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting(); // Activate ngay lập tức
      })
  );
});

// ============================================
// ACTIVATE EVENT - Clean up old caches
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log(`[SW] Deleting old cache: ${name}`);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// ============================================
// FETCH EVENT - Handle requests with cache strategies
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Bỏ qua non-GET requests và chrome-extension
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Bỏ qua WebSocket
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // Xác định strategy dựa trên loại request
  if (CACHE_PATTERNS.static.test(url.pathname)) {
    // STATIC ASSETS: Cache First
    event.respondWith(cacheFirst(request));
  } else if (CACHE_PATTERNS.api.test(url.pathname)) {
    // API CALLS: Network First
    event.respondWith(networkFirst(request));
  } else {
    // HTML PAGES: Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request));
  }
});

// ============================================
// CACHE STRATEGIES
// ============================================

/**
 * Cache First - Ưu tiên cache, fallback network
 * Phù hợp cho: Static assets (CSS, JS, Images)
 */
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache First failed:', error);
    // Return placeholder cho images
    if (request.url.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#f0f0f0" width="200" height="200"/><text fill="#999" x="50%" y="50%" text-anchor="middle">Image</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    throw error;
  }
}

/**
 * Network First - Ưu tiên network, fallback cache
 * Phù hợp cho: API calls, dynamic data
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline JSON response cho API
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Không có kết nối mạng. Vui lòng thử lại sau.' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

/**
 * Stale While Revalidate - Trả cache ngay, update background
 * Phù hợp cho: HTML pages, content thay đổi không quá thường xuyên
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await caches.match(request);
  
  // Fetch từ network trong background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(async (error) => {
      console.log('[SW] Network failed for page:', request.url);
      // Nếu không có cache, trả về offline page
      if (!cachedResponse) {
        const offlinePage = await caches.match(OFFLINE_URL);
        return offlinePage || new Response('Offline', { status: 503 });
      }
      throw error;
    });

  // Trả cached response ngay nếu có, không thì chờ network
  return cachedResponse || fetchPromise;
}

// ============================================
// BACKGROUND SYNC - Retry failed requests
// ============================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background Sync:', event.tag);
  
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  } else if (event.tag === 'sync-order') {
    event.waitUntil(syncOrder());
  }
});

async function syncCart() {
  // Lấy pending cart updates từ IndexedDB và sync
  console.log('[SW] Syncing cart...');
  // Implementation tùy theo cấu trúc app
}

async function syncOrder() {
  console.log('[SW] Syncing orders...');
  // Implementation tùy theo cấu trúc app
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let data = {
    title: 'Source Computer',
    body: 'Bạn có thông báo mới!',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg'
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    },
    actions: data.actions || [
      { action: 'open', title: 'Xem ngay' },
      { action: 'close', title: 'Đóng' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Nếu đã có tab mở, focus vào đó
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Nếu chưa có, mở tab mới
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================
// MESSAGE HANDLER - Communication with main thread
// ============================================
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('[SW] Service Worker loaded');
