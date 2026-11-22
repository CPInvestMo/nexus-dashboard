'use strict';
const CACHE='nael-mobile-shell-v1.4-google-readonly-setup';
const PRECACHE=['./','./index.html','./action-center.html','./action-manifest.webmanifest','./app.js','./styles.css','./manifest.webmanifest','./icons/favicon-192.png','./icons/app-icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRECACHE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const u=new URL(event.request.url);
  if(event.request.method!=='GET'||u.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).catch(()=>caches.match('./index.html')));return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
