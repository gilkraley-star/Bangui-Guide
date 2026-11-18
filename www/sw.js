const C='bg-v1';self.addEventListener('install',e=>{e.waitUntil(fetch('_files.json').then(r=>r.json()).then(l=>caches.open(C).then(c=>c.addAll([...l,'manifest.json','icons/logo.png','icons/icon-192.png']))));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(clients.claim()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
