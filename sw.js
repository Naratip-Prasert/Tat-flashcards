// Service worker: เก็บไฟล์ไว้ใช้ออฟไลน์
// - ไฟล์ของแอป (หน้าเว็บ, คำศัพท์): โหลดจากเน็ตก่อน → อัปเดตขึ้นทันทีที่ push, ถ้าออฟไลน์ใช้ตัวที่เก็บไว้
// - ฟอนต์จาก Google: ใช้ตัวที่เก็บไว้ก่อน
const C = "tango-v16";
const CORE = ["./", "./index.html", "./data/vocab.js", "./data/sentences.js", "./js/sentence-gen.js", "./js/exercise-bank.js", "./js/firebase-config.js", "./js/sync.js", "./manifest.webmanifest",
              "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const sameOrigin = new URL(req.url).origin === self.location.origin;
  if (sameOrigin) {
    const key = req.mode === "navigate" ? "./index.html" : req;
    e.respondWith(
      fetch(req, { cache: "no-cache" }).then(res => {   // revalidate with GitHub so new pushes show right away (Pages caches ~10 min)
        if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(key, cp)); }
        return res;
      }).catch(() => caches.match(key, { ignoreSearch: true }))
    );
  } else {
    // only cache static libraries (Google Fonts, Firebase SDK); never touch Firebase API traffic (login / realtime sync)
    const u = new URL(req.url);
    const cacheable = u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com" || (u.hostname === "www.gstatic.com" && u.pathname.startsWith("/firebasejs/"));
    if (!cacheable) return;
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      if (res.ok || res.type === "opaque") { const cp = res.clone(); caches.open(C).then(c => c.put(req, cp)); }
      return res;
    })));
  }
});
