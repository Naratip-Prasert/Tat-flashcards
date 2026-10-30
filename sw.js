// v4 — network-first for pages so new versions show up; cache-first for icons/fonts
const C="tango-v4";
const CORE=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const req=e.request; if(req.method!=="GET") return;
  const isPage=req.mode==="navigate"||req.destination==="document";
  if(isPage){
    e.respondWith(fetch(req).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put("./index.html",cp));return res})
      .catch(()=>caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{if(res.ok||res.type==="opaque"){const cp=res.clone();caches.open(C).then(c=>c.put(req,cp))}return res})));
});
