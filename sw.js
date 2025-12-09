// Service Worker для TunWars App PWA
// Версия 1.0

const CACHE_NAME = 'tunwars-app-v1';
const RUNTIME_CACHE = 'tunwars-runtime-v1';
const TILE_CACHE = 'tunwars-tiles-v1';

// Ресурсы для предзагрузки (Cache First)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/route.html',
  '/journey.html',
  '/location.html',
  '/manifest.json',
  '/favicon.ico',
  '/Локации%20Туниса%20-%20Интерактивный%20справочник_files/locations-data.js',
  '/Локации%20Туниса%20-%20Интерактивный%20справочник_files/main.js',
  '/Локации%20Туниса%20-%20Интерактивный%20справочник_files/detailed-descriptions.js',
  '/Локации%20Туниса%20-%20Интерактивный%20справочник_files/leaflet.css',
  '/Локации%20Туниса%20-%20Интерактивный%20справочник_files/leaflet.js',
  '/Локации%20Туниса%20-%20Интерактивный%20справочник_files/all.min.css'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching assets...');
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[SW] Some assets failed to precache:', err);
          // Продолжаем даже если некоторые ресурсы не загрузились
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log('[SW] Service Worker installed');
        // Активируем сразу, не дожидаясь закрытия всех вкладок
        // Это критически важно для iOS PWA
        return self.skipWaiting().then(() => {
          console.log('[SW] Service Worker активирован через skipWaiting');
          // Уведомляем все клиенты о новой версии
          return self.clients.claim();
        });
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  console.log('[SW] Клиенты:', self.clients);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Удаляем старые кеши
            if (cacheName !== CACHE_NAME && 
                cacheName !== RUNTIME_CACHE && 
                cacheName !== TILE_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        // Берем контроль над всеми страницами
        return self.clients.claim();
      })
  );
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Пропускаем запросы не-GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Пропускаем chrome-extension и другие не-HTTP(S) протоколы
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Определяем тип запроса
  if (isTileRequest(url)) {
    // Запросы тайлов Leaflet - кешируем при первом запросе (Stale While Revalidate)
    event.respondWith(handleTileRequest(event.request));
  } else if (isStaticAsset(url)) {
    // Статические ресурсы - Cache First
    event.respondWith(handleStaticAsset(event.request));
  } else if (isSameOrigin(url)) {
    // Запросы к нашему домену - Network First с fallback на кеш
    event.respondWith(handleSameOriginRequest(event.request));
  } else {
    // Внешние CDN ресурсы - Network First
    event.respondWith(handleExternalRequest(event.request));
  }
});

// Проверка, является ли запрос тайлом Leaflet
function isTileRequest(url) {
  // Паттерны для различных провайдеров тайлов
  const tilePatterns = [
    /tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png/i,
    /tiles\.openstreetmap\.org\/\d+\/\d+\/\d+\.png/i,
    /\{s\}\.tile\.openstreetmap\.org/i,
    /tile\.osm\.org/i,
    /\.tile\./i,
    /\/\d+\/\d+\/\d+\.(png|jpg|jpeg|webp)/i // Общий паттерн для тайлов
  ];
  
  return tilePatterns.some(pattern => pattern.test(url.href));
}

// Проверка, является ли ресурс статическим (локальным)
function isStaticAsset(url) {
  const staticPatterns = [
    /\.(js|css|json|xml|ico|svg|woff|woff2|ttf|eot)$/i,
    /\/photos\//i,
    /\/icons\//i,
    /locations-data\.js/i,
    /main\.js/i,
    /detailed-descriptions\.js/i,
    /leaflet\.(js|css)/i,
    /all\.min\.css/i
  ];
  
  return staticPatterns.some(pattern => pattern.test(url.pathname));
}

// Проверка, является ли запрос к нашему домену
function isSameOrigin(url) {
  const origin = self.location.origin;
  return url.origin === origin;
}

// Обработка запросов тайлов (Stale While Revalidate)
async function handleTileRequest(request) {
  const cache = await caches.open(TILE_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Сразу возвращаем кешированный ответ, если есть
  const fetchPromise = fetch(request)
    .then((response) => {
      // Кешируем только успешные ответы
      if (response && response.status === 200) {
        const responseToCache = response.clone();
        cache.put(request, responseToCache).catch((err) => {
          console.warn('[SW] Failed to cache tile:', err);
        });
      }
      return response;
    })
    .catch((err) => {
      console.warn('[SW] Failed to fetch tile:', err);
      // Если запрос не удался и есть кеш, возвращаем его
      return cachedResponse;
    });
  
  // Возвращаем кеш сразу, если есть, иначе ждем ответа от сети
  return cachedResponse || fetchPromise;
}

// Обработка статических ресурсов (Cache First)
async function handleStaticAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache).catch((err) => {
        console.warn('[SW] Failed to cache static asset:', err);
      });
    }
    return networkResponse;
  } catch (err) {
    console.warn('[SW] Failed to fetch static asset:', err);
    // Возвращаем заглушку для отсутствующих ресурсов
    return new Response('Resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Обработка запросов к нашему домену (Network First)
async function handleSameOriginRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache).catch((err) => {
        console.warn('[SW] Failed to cache runtime asset:', err);
      });
    }
    return networkResponse;
  } catch (err) {
    console.warn('[SW] Network request failed, trying cache...', err);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw err;
  }
}

// Обработка внешних запросов (Network First, без кеширования для CDN)
async function handleExternalRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (err) {
    console.warn('[SW] External request failed:', err);
    // Для CDN ресурсов не используем кеш, просто возвращаем ошибку
    return new Response('Network error', {
      status: 408,
      statusText: 'Request Timeout'
    });
  }
}

// Сообщения от клиента
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_TILES') {
    // Запрос на предзагрузку тайлов для области просмотра
    const { bounds, zoom } = event.data;
    console.log('[SW] Cache tiles request received for bounds:', bounds, 'zoom:', zoom);
    preloadTilesForBounds(bounds, zoom).catch(err => {
      console.warn('[SW] Failed to preload tiles:', err);
    });
  }
});

// Предзагрузка тайлов для заданной области и уровня масштаба
async function preloadTilesForBounds(bounds, zoom) {
  const cache = await caches.open(TILE_CACHE);
  const tileUrls = generateTileUrls(bounds, zoom);
  let cached = 0;
  
  console.log(`[SW] Preloading ${tileUrls.length} tiles...`);
  
  // Загружаем тайлы с ограничением по параллельности
  const batchSize = 10;
  for (let i = 0; i < tileUrls.length; i += batchSize) {
    const batch = tileUrls.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async (url) => {
        try {
          // Проверяем, есть ли уже в кеше
          const cached = await cache.match(url);
          if (cached) return;
          
          const response = await fetch(url);
          if (response && response.status === 200) {
            await cache.put(url, response.clone());
            cached++;
          }
        } catch (err) {
          // Игнорируем ошибки отдельных тайлов
          console.warn(`[SW] Failed to cache tile ${url}:`, err);
        }
      })
    );
  }
  
  console.log(`[SW] Preloaded ${cached} new tiles`);
}

// Генерация URL тайлов для области и уровня масштаба
function generateTileUrls(bounds, zoom) {
  const urls = [];
  const minZoom = Math.max(zoom - 2, 1); // Загружаем текущий уровень и 2 уровня ниже
  const maxZoom = Math.min(zoom + 1, 19); // И 1 уровень выше
  
  // OpenStreetMap tile server pattern
  const tileServers = ['a', 'b', 'c'];
  
  for (let z = minZoom; z <= maxZoom; z++) {
    const nw = latLonToTile(bounds.north, bounds.west, z);
    const se = latLonToTile(bounds.south, bounds.east, z);
    
    for (let x = nw.x; x <= se.x; x++) {
      for (let y = nw.y; y <= se.y; y++) {
        // Используем разные серверы для распределения нагрузки
        const server = tileServers[(x + y) % tileServers.length];
        urls.push(`https://${server}.tile.openstreetmap.org/${z}/${x}/${y}.png`);
      }
    }
  }
  
  return urls;
}

// Преобразование координат в номер тайла
function latLonToTile(lat, lon, zoom) {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lon + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y };
}

// Обработка ошибок
self.addEventListener('error', (event) => {
  console.error('[SW] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});


