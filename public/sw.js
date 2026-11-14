const BUILD='0.3.0-web.37';
const CACHE='financas-shell-'+BUILD;
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/manifest.webmanifest','/icons/icon-192.png','/icons/icon-512.png'])));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('financas-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin||(url.pathname.startsWith('/api/')||url.pathname.startsWith('/auth'))||/signin|signout|callback/.test(url.pathname))return;
 if(request.mode==='navigate'){event.respondWith(fetch(request).then(response=>{if(response.ok&&!response.redirected){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('/',copy));}return response;}).catch(async()=>await caches.match('/')||new Response('Abra o VR Finanças com conexão uma vez antes de usar offline.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})));return;}
 if(/\.(?:js|css|png|webp|svg|woff2?|json)$/.test(url.pathname)){event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok&&!response.redirected){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}return response;})));}
});
