const CACHE_NAME = 'backlog-v10';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './icon.svg',
    'https://cdn.tailwindcss.com'
];

// Instalação do Service Worker e caching de arquivos estáticos
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Arquivos em cache com sucesso.');
                return cache.addAll(ASSETS);
            })
    );
    self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Limpando cache antigo:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Intercepção de requisições e resposta offline (Network First com Fallback para Cache)
self.addEventListener('fetch', event => {
    // Não intercepta chamadas de API (IGDB, corsproxy ou tradução)
    if (
        event.request.url.includes('api.igdb.com') || 
        event.request.url.includes('corsproxy.io') || 
        event.request.url.includes('id.twitch.tv')
    ) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Se der certo e for uma requisição GET válida, atualiza o cache
                if (response && response.status === 200 && event.request.method === 'GET') {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Se falhar (ex: offline), busca do cache
                return caches.match(event.request);
            })
    );
});
