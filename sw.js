const CACHE_NAME = "student-cms-v1";
const urlsToCache = [
    "/",
    "/html/students.html",
    "/css/style.css",
    "/js/script.js",
    "/images/avatar-1.jpg",
    "/images/avatar-2.jpg",
    "/images/avatar-3.jpg"
];

// Подія "install" для кешування ресурсів
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            // Використовуємо Promise.all для обробки кожного запиту окремо
            return Promise.all(
                urlsToCache.map(url => {
                    return fetch(url, { mode: "no-cors" }) // Додаємо mode: "no-cors" для уникнення проблем із CORS
                        .then(response => {
                            if (!response.ok) {
                                console.warn(`Failed to cache ${url}: ${response.statusText}`);
                                return null; // Пропускаємо невдалі запити
                            }
                            return cache.put(url, response); // Додаємо успішний запит до кешу
                        })
                        .catch(error => {
                            console.warn(`Failed to fetch ${url}: ${error}`);
                            return null; // Пропускаємо невдалі запити
                        });
                })
            );
        })
    );
});

// Подія "fetch" для обробки запитів
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).catch(() => {
                console.warn(`Fetch failed for ${event.request.url}`);
                return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
            });
        })
    );
});

// Подія "activate" для очищення старих кешів (опціонально)
self.addEventListener("activate", event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});