// service-worker.js
const CACHE_NAME = 'cases-llm-v2';
const BASE_URL = self.location.pathname.replace('service-worker.js', '');
const APP_SHELL = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/css/main.chunk.css',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/offline.html',
  '/data/index.json'
];

// Instalação do service worker e cache de recursos
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cacheando app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => self.skipWaiting())
  );
});

// Limpeza de caches antigos
self.addEventListener('activate', event => {
  console.log('Service Worker: Ativando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('Service Worker: Limpando cache antigo', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia para recursos da aplicação
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Estratégia específica para dados JSON
  if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(networkFirstWithCache(event.request));
  } 
  // Estratégia para recursos estáticos principais
  else if (APP_SHELL.includes(url.pathname) || url.pathname.startsWith('/static/')) {
    event.respondWith(cacheFirstWithNetwork(event.request));
  }
  // Estratégia padrão para outros recursos
  else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Cache hit - return response
          if (response) {
            return response;
          }
          return fetch(event.request).then(
            response => {
              // Check if we received a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clone the response
              var responseToCache = response.clone();

              caches.open(CACHE_NAME)
                .then(cache => {
                  // Add response to cache
                  cache.put(event.request, responseToCache);
                });

              return response;
            }
          );
        }).catch(() => {
          // Quando offline e recurso não está em cache, mostra página offline
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        })
    );
  }
});

// Estratégia: Tenta rede primeiro, com fallback para cache
async function networkFirstWithCache(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Tentar buscar da rede
    const networkResponse = await fetch(request);
    
    // Se bem-sucedido, atualizar o cache
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Fallback para cache', request.url);
    
    // Se falhar, tentar o cache
    const cachedResponse = await cache.match(request);
    return cachedResponse || Promise.reject('no-match');
  }
}

// Estratégia: Tenta cache primeiro, com fallback para rede
async function cacheFirstWithNetwork(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Tentar buscar do cache
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Se não estiver no cache, buscar da rede
  try {
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Falha ao buscar:', request.url);
    
    // Para recursos HTML, retornar a página offline
    if (request.headers.get('Accept').includes('text/html')) {
      return caches.match('/offline.html');
    }
    
    return Promise.reject('no-match');
  }
}

// Sincronização em background quando online
self.addEventListener('sync', event => {
  if (event.tag === 'sync-cases') {
    console.log('Service Worker: Sincronizando cases em background');
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        if (clients && clients.length > 0) {
          // Enviar mensagem para o cliente executar a sincronização
          clients[0].postMessage({
            type: 'SYNC_CASES'
          });
        }
      })
    );
  }
});

// Lidar com notificações push
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Novidades disponíveis!',
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Atualização Cases de Co-criação', 
        options
      )
    );
  }
});

// Lidar com cliques em notificações
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});