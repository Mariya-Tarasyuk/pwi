const CACHE_NAME = "student-cms-v1";
const DATA_CACHE_NAME = "student-data-v1"; // Окремий кеш для даних
const urlsToCache = [
    "/",
    "/html/students.html",
    "/css/style.css",
    "/js/script.js",
    "/js/fontawesome.js",
    "/images/avatar-1.jpg",
    "/images/avatar-2.jpg",
    "/images/avatar-3.jpg",
    "/images/icon-192.png",
    "/images/icon-512.png",
    "/images/screenshot-desktop.png",
    "/images/screenshot-mobile.png",
    "/manifest.json",
    "/offline.html"
];

// Подія "install" для кешування статичних ресурсів
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return Promise.all(
                urlsToCache.map(url => {
                    return fetch(url, { mode: "no-cors" })
                        .then(response => {
                            if (!response.ok) {
                                console.warn(`Failed to cache ${url}: ${response.statusText}`);
                                return null;
                            }
                            return cache.put(url, response);
                        })
                        .catch(error => {
                            console.warn(`Failed to fetch ${url}: ${error}`);
                            return null;
                        });
                })
            );
        })
    );
});

// Обробка повідомлень від клієнта для оновлення кешу
self.addEventListener("message", event => {
    if (event.data && event.data.type === "UPDATE_CACHE") {
        caches.open(DATA_CACHE_NAME).then(cache => {
            const response = new Response(JSON.stringify(event.data.data), {
                headers: { "Content-Type": "application/json" }
            });
            cache.put("/api/students", response);
            console.log("Students data cached successfully");
        });
    }
});

// Подія "fetch" для обробки запитів
self.addEventListener("fetch", event => {
    const requestUrl = new URL(event.request.url);

    // Якщо запит до /api/students, повертаємо дані з кешу
    if (requestUrl.pathname === "/api/students") {
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return cache.match("/api/students").then(response => {
                    if (response) {
                        return response;
                    }
                    // Якщо немає в кеші, повертаємо порожній масив
                    return new Response(JSON.stringify([]), {
                        headers: { "Content-Type": "application/json" }
                    });
                });
            })
        );
        return;
    }

    // Для всіх інших запитів
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                return response;
            }
            return fetch(event.request).catch(() => {
                return caches.match("/offline.html");
            });
        })
    );
});

// Подія "activate" для очищення старих кешів
self.addEventListener("activate", event => {
    const cacheWhitelist = [CACHE_NAME, DATA_CACHE_NAME];
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