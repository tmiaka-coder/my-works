/**
 * Service Worker - AI Janken PWA
 *
 * キャッシュ戦略:
 *   - アプリシェル（HTML/CSS/JS）: Cache First でオフライン対応
 *   - MediaPipe 外部CDN: Network First（常に最新モデルを使用）
 */

'use strict';

const CACHE_NAME = 'ai-janken-v2';

const APP_SHELL = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './icon-192x192.png',
    './icon-512x512.png',
];

/* ---------- インストール ---------- */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting()) // 即座にアクティブ化
    );
});

/* ---------- アクティベート（古いキャッシュ削除） ---------- */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

/* ---------- フェッチ ---------- */
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 外部CDN（MediaPipe等）はキャッシュをスキップしてネットワーク優先
    if (url.origin !== self.location.origin) {
        return; // ブラウザのデフォルト動作に委ねる
    }

    // 同一オリジンのリソース: Cache First
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                // 正常なレスポンスのみキャッシュ
                if (response && response.status === 200 && response.type === 'basic') {
                    const toCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
                }
                return response;
            });
        })
    );
});
