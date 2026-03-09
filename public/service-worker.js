// Flowment Service Worker V2.1
// PWA 오프라인 캐싱 및 백그라운드 동기화

const CACHE_VERSION = 'flowment-v2.1.0';
const RUNTIME_CACHE = 'flowment-runtime';
const CACHE_TIMEOUT = 5000; // 5초

// 캐시할 정적 파일 목록
const STATIC_ASSETS = [
  '/',
  '/write',
  '/timeline',
  '/calendar',
  '/settings',
  '/static/cache.js',
  '/static/landing.js',
  '/static/write.js',
  '/static/timeline.js',
  '/static/calendar.js',
  '/static/settings.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

// API 엔드포인트 (런타임 캐싱)
const API_ENDPOINTS = [
  '/api/entries',
  '/api/memory-gate',
  '/api/keywords/frequency',
  '/api/settings'
];

// Install 이벤트: 정적 자산 캐싱
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting(); // 즉시 활성화
      })
      .catch((error) => {
        console.error('[SW] Cache installation failed:', error);
      })
  );
});

// Activate 이벤트: 구버전 캐시 삭제
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_VERSION && cacheName !== RUNTIME_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim(); // 모든 클라이언트 제어
      })
  );
});

// Fetch 이벤트: 네트워크 요청 인터셉트
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 요청: Network First (네트워크 우선, 실패 시 캐시)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirstWithTimeout(request)
    );
    return;
  }

  // CDN 리소스 (Tailwind, Google Fonts): 캐시 우선
  if (url.origin.includes('cdn.tailwindcss.com') || 
      url.origin.includes('fonts.googleapis.com') ||
      url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      cacheFirst(request, RUNTIME_CACHE)
    );
    return;
  }

  // 정적 자산: Cache First (캐시 우선, 실패 시 네트워크)
  event.respondWith(
    cacheFirst(request, CACHE_VERSION)
  );
});

// Network First with Timeout (API 요청용)
async function networkFirstWithTimeout(request) {
  try {
    // 네트워크 요청 (타임아웃 설정)
    const networkPromise = fetch(request.clone());
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network timeout')), CACHE_TIMEOUT)
    );

    const response = await Promise.race([networkPromise, timeoutPromise]);

    // 성공 시 런타임 캐시 업데이트
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    // 네트워크 실패 시 캐시에서 반환
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // 캐시도 없으면 오프라인 응답 반환
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '오프라인 모드입니다. 네트워크 연결을 확인해주세요.',
          offline: true
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // HTML 페이지는 루트 캐시 반환
    if (request.headers.get('accept')?.includes('text/html')) {
      const rootCache = await caches.match('/');
      if (rootCache) {
        return rootCache;
      }
    }

    // 그 외는 에러 반환
    return new Response('오프라인 상태입니다', { status: 503 });
  }
}

// Cache First (정적 자산용)
async function cacheFirst(request, cacheName) {
  try {
    // 1. 캐시 확인
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // 백그라운드에서 캐시 업데이트 (stale-while-revalidate)
      fetch(request).then((response) => {
        if (response && response.ok) {
          caches.open(cacheName).then((cache) => {
            cache.put(request, response);
          });
        }
      }).catch(() => {
        // 네트워크 에러는 무시 (이미 캐시 반환함)
      });

      return cachedResponse;
    }

    // 2. 캐시 없으면 네트워크
    const response = await fetch(request);
    
    // 성공 시 캐시 저장
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    
    // HTML 페이지는 루트 캐시 반환
    if (request.headers.get('accept')?.includes('text/html')) {
      const rootCache = await caches.match('/');
      if (rootCache) {
        return rootCache;
      }
    }

    throw error;
  }
}

// Background Sync 이벤트 (향후 구현)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-entries') {
    event.waitUntil(syncEntries());
  }
});

// 백그라운드 일기 동기화 (향후 구현)
async function syncEntries() {
  console.log('[SW] Syncing offline entries...');
  
  try {
    // LocalStorage에서 오프라인 일기 가져오기
    // API로 전송
    // 성공 시 LocalStorage에서 제거
    
    console.log('[SW] Entries synced successfully');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error; // 재시도를 위해 에러 throw
  }
}

// Push 알림 이벤트 (향후 구현)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Flowment';
  const options = {
    body: data.body || '새로운 알림이 있습니다',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    vibrate: [200, 100, 200],
    data: data,
    actions: [
      {
        action: 'open',
        title: '열기'
      },
      {
        action: 'close',
        title: '닫기'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[SW] Service Worker loaded:', CACHE_VERSION);
