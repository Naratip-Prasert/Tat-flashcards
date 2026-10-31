/* =====================================================================
   ☁️ ล็อกอินง่าย ๆ (ชื่อผู้ใช้ + รหัสผ่าน) + ซิงก์ความคืบหน้าข้ามเครื่อง
   ใช้ Firebase Auth + Firestore (โหลดจาก CDN เมื่อมี config เท่านั้น)
   ข้อมูลที่ซิงก์: fc3-status (จำได้/กำลังเรียน), fc3-star (ติดดาว), fc3-sent (สถิติเขียนประโยค)
   เก็บที่ Firestore: users/{uid} = { data:{status,star,sent}, t, dev, name }
   ===================================================================== */
const FB = "10.12.2";
const cfg = window.TAT_FIREBASE;
const $ = id => document.getElementById(id);
const KEYS = { status: "fc3-status", star: "fc3-star", sent: "fc3-sent" };
const DOMAIN = "tatcard.app";                       // ชื่อผู้ใช้ → อีเมลภายใน (ไม่ต้องมีอีเมลจริง)
const LS = { get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
             set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const DEV = LS.get("fc3-dev") || (() => { const d = Math.random().toString(36).slice(2, 10); LS.set("fc3-dev", d); return d; })();
const toast = m => window.TatApp && window.TatApp.toast(m);

let fb = null, user = null, ref = null, unsub = null, timer = null, state = "init", lastErr = "";

/* ---------------- local data ---------------- */
const readLocal = () => ({ status: LS.get(KEYS.status) || {}, star: LS.get(KEYS.star) || [], sent: LS.get(KEYS.sent) || {} });
function writeLocal(d) {
  LS.set(KEYS.status, d.status || {}); LS.set(KEYS.star, d.star || []); LS.set(KEYS.sent, d.sent || {});
  window.TatApp && window.TatApp.reload();
}
const localT = () => +localStorage.getItem("fc3-sync-t") || 0;
const setLocalT = t => localStorage.setItem("fc3-sync-t", String(t));
// first login on a device: keep the best of both sides so nothing is lost
function merge(a, b) {
  const R = { k: 2, l: 1 }, S = { ok: 3, near: 2, no: 1 };
  const status = { ...a.status };
  Object.entries(b.status || {}).forEach(([k, v]) => { if (!status[k] || (R[v] || 0) > (R[status[k]] || 0)) status[k] = v; });
  const star = [...new Set([...(a.star || []), ...(b.star || [])])];
  const sent = { ...a.sent };
  Object.entries(b.sent || {}).forEach(([k, v]) => { const x = sent[k] || {};
    sent[k] = { best: (S[v.best] || 0) > (S[x.best] || 0) ? v.best : x.best, ...(v.spoke || x.spoke ? { spoke: true } : {}) };
    if (!sent[k].best) delete sent[k].best; });
  return { status, star, sent };
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ---------------- UI (account card on home + login sheet) ---------------- */
function render() {
  const box = $("acct"); if (!box) return;
  const P = LS.get("fc3-profile") || {}, un = user ? user.email.split("@")[0] : "", nm = P.name || un;
  const S = {
    nocfg: ["☁️", "ซิงก์ข้ามเครื่อง", "ยังไม่ได้เชื่อมเซิร์ฟเวอร์ (ตั้งค่า Firebase ตาม README)", ""],
    init: ["☁️", "กำลังเชื่อมต่อ…", "", ""],
    loaderr: ["📴", "ยังเชื่อมต่อไม่ได้", "ต่อเน็ตแล้วเปิดแอปใหม่อีกครั้งนะ — ระหว่างนี้เซฟในเครื่องตามปกติ", ""],
    out: ["☁️", "เข้าสู่ระบบเพื่อซิงก์", "จำได้/ติดดาว/สถิติ จะตรงกันทุกเครื่อง", `<button class="acbtn pri" id="acIn">เข้าสู่ระบบ</button>`],
    syncing: ["🔄", nm, "กำลังซิงก์…", `<button class="acbtn" id="acOut">ออกจากระบบ</button>`],
    synced: ["✅", nm, "ซิงก์แล้ว · ใช้ชื่อนี้ล็อกอินเครื่องอื่นได้เลย", `<button class="acbtn" id="acOut">ออกจากระบบ</button>`],
    offline: ["📴", nm, "ออฟไลน์อยู่ — เดี๋ยวซิงก์ให้เองเมื่อมีเน็ต", `<button class="acbtn" id="acOut">ออกจากระบบ</button>`],
    error: ["⚠️", nm, "ซิงก์ไม่สำเร็จ: " + lastErr, `<button class="acbtn" id="acOut">ออกจากระบบ</button>`]
  }[state] || ["☁️", "", "", ""];
  const icon = P.avatar ? `<img class="acav" src="${P.avatar}" alt="">` : `<span class="acic">${S[0]}</span>`;
  box.innerHTML = `<div class="actap" id="acGo" style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">${icon}<div class="actx"><b>${esc(S[1])}${state !== "nocfg" && state !== "init" ? ` <span style="font-weight:500;color:var(--muted);font-size:12px">· โปรไฟล์ ›</span>` : ""}</b><small>${esc(S[2])}</small></div></div>${S[3]}`;
  $("acGo").onclick = () => window.TatApp && window.TatApp.go("profile");
  const i = $("acIn"); if (i) i.onclick = openSheet;
  const o = $("acOut"); if (o) o.onclick = () => { if (o.dataset.arm) { logout(); } else { o.dataset.arm = 1; o.textContent = "แตะอีกครั้ง"; setTimeout(() => { if (o.isConnected) { delete o.dataset.arm; o.textContent = "ออกจากระบบ"; } }, 2500); } };
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const setState = s => { state = s; render(); };

let signup = false;
function openSheet() {
  signup = false; drawSheet(); $("lg").classList.add("on");
  setTimeout(() => $("lgU") && $("lgU").focus(), 80);
}
function drawSheet() {
  $("lgBox").innerHTML = `
    <button class="lgx" id="lgX" aria-label="ปิด">×</button>
    <div class="lgh">☁️ ${signup ? "สมัครบัญชีใหม่" : "เข้าสู่ระบบ"}</div>
    <p class="lgp">${signup ? "ตั้งชื่อผู้ใช้กับรหัสผ่าน แล้วใช้ชื่อเดียวกันล็อกอินทุกเครื่อง" : "ล็อกอินชื่อเดียวกันทุกเครื่อง แล้วความคืบหน้าจะตรงกันหมด"}</p>
    <form id="lgF" autocomplete="on">
      <label>ชื่อผู้ใช้<input id="lgU" name="username" autocomplete="username" autocapitalize="off" spellcheck="false" placeholder="เช่น tat" maxlength="20"></label>
      <label>รหัสผ่าน<input id="lgP" name="password" type="password" autocomplete="${signup ? "new-password" : "current-password"}" placeholder="อย่างน้อย 6 ตัว"></label>
      ${signup ? `<label>ยืนยันรหัสผ่าน<input id="lgP2" type="password" autocomplete="new-password"></label>` : ""}
      <div class="lgerr" id="lgE"></div>
      <button class="lgsub" id="lgS" type="submit">${signup ? "สมัครและเข้าสู่ระบบ" : "เข้าสู่ระบบ"}</button>
    </form>
    <div class="lgsw">${signup ? `มีบัญชีแล้ว? <button id="lgT">เข้าสู่ระบบ</button>` : `ยังไม่มีบัญชี? <button id="lgT">สมัครใหม่</button>`}</div>
    <p class="lgnote">ไม่ต้องใช้อีเมล · ลืมรหัสจะกู้ไม่ได้ จดไว้ด้วยนะ</p>`;
  $("lgX").onclick = closeSheet; $("lgT").onclick = () => { signup = !signup; drawSheet(); };
  $("lgF").onsubmit = e => { e.preventDefault(); submit(); };
}
const closeSheet = () => $("lg").classList.remove("on");

async function submit() {
  const u = ($("lgU").value || "").trim().toLowerCase(), p = $("lgP").value || "", E = $("lgE");
  E.textContent = "";
  if (!/^[a-z0-9._-]{3,20}$/.test(u)) { E.textContent = "ชื่อผู้ใช้ใช้ a-z, 0-9, . _ - ได้ 3–20 ตัว"; return; }
  if (p.length < 6) { E.textContent = "รหัสผ่านอย่างน้อย 6 ตัวนะ"; return; }
  if (signup && p !== ($("lgP2").value || "")) { E.textContent = "รหัสผ่านสองช่องไม่ตรงกัน"; return; }
  if (!fb) { E.textContent = "ยังเชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง"; return; }
  const btn = $("lgS"); btn.disabled = true; btn.textContent = "กำลังเข้าสู่ระบบ…";
  try {
    const email = `${u}@${DOMAIN}`;
    if (signup) await fb.createUserWithEmailAndPassword(fb.auth, email, p);
    else await fb.signInWithEmailAndPassword(fb.auth, email, p);
    closeSheet(); if (window.TatRole) TatRole.fromUser(u);
    toast(signup ? T("welcomeNew") : T("welcomeBack", { u }));
  } catch (e) {
    const c = e && e.code || "";
    E.textContent = c.includes("email-already-in-use") ? "ชื่อนี้มีคนใช้แล้ว ลองชื่ออื่นนะ"
      : /invalid-credential|wrong-password|user-not-found|invalid-login/.test(c) ? "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
      : c.includes("weak-password") ? "รหัสผ่านอย่างน้อย 6 ตัวนะ"
      : c.includes("too-many-requests") ? "ลองผิดหลายครั้งไป รอสักครู่แล้วลองใหม่นะ"
      : c.includes("network") ? "ต่อเน็ตไม่ได้ ลองใหม่อีกครั้ง"
      : c.includes("operation-not-allowed") ? "ยังไม่ได้เปิด Email/Password ใน Firebase" : "เข้าสู่ระบบไม่สำเร็จ (" + c + ")";
    btn.disabled = false; btn.textContent = signup ? "สมัครและเข้าสู่ระบบ" : "เข้าสู่ระบบ";
  }
}

const T = (k, v) => (window.TatRole ? TatRole.tr(k, v) : k);

/* ---------------- sync ---------------- */
async function start(u) {
  if (window.TatRole) TatRole.fromUser(u.email.split("@")[0]);
  user = u; ref = fb.doc(fb.db, "users", u.uid); setState("syncing");
  let remote = null;
  try { const s = await fb.getDoc(ref); remote = s.exists() ? s.data() : null; }
  catch (e) { setState("offline"); }
  const local = readLocal(), lastUid = localStorage.getItem("fc3-sync-uid");
  let data = local, push = false;
  if (!remote || !remote.data) { push = true; }
  else if (lastUid !== u.uid) { data = merge(local, remote.data); push = !same(data, remote.data); }     // first time on this device
  else if (localT() > (remote.t || 0)) { push = true; }                                                     // changed here while offline
  else { data = remote.data; }
  if (!same(data, local)) writeLocal(data);
  // profile (name / pictures / stamp): newest wins
  const lp = LS.get("fc3-profile"), rp = remote && remote.profile;
  if (rp && (!lp || (rp.t || 0) > (lp.t || 0))) applyProfile(rp);
  else if (lp && lp.t && (!rp || lp.t > (rp.t || 0))) pushProfileNow(lp);
  localStorage.setItem("fc3-sync-uid", u.uid);
  if (push) { setLocalT(Math.max(Date.now(), localT())); await pushNow(); } else { setLocalT(remote ? remote.t || 0 : 0); if (state !== "offline") setState("synced"); }
  if (unsub) unsub();
  unsub = fb.onSnapshot(ref, s => {                                         // live updates from other devices
    if (s.metadata.hasPendingWrites || !s.exists()) return;
    const r = s.data();
    if (r.dev !== DEV && (r.t || 0) > localT() && r.data) { setLocalT(r.t); writeLocal(r.data); toast("☁️ อัปเดตจากอีกเครื่องแล้ว"); }
    const lp = LS.get("fc3-profile");
    if (r.profile && (!lp || (r.profile.t || 0) > (lp.t || 0))) applyProfile(r.profile);
    if (state !== "syncing") setState("synced");
  }, () => setState("offline"));
}
function applyProfile(p) { LS.set("fc3-profile", p); window.TatApp && window.TatApp.profileChanged(); render(); }
let ptimer = null;
function pushProfileNow(p) {
  if (!user || !ref) return Promise.resolve();
  return fb.setDoc(ref, { profile: p }, { merge: true }).then(() => { if (state !== "syncing") setState("synced"); })
    .catch(e => { lastErr = (e && e.code) || "unknown"; setState(navigator.onLine ? "error" : "offline"); });
}
async function pushNow() {
  if (!user || !ref) return;
  clearTimeout(timer); setState("syncing");
  try {
    await fb.setDoc(ref, { data: readLocal(), t: localT(), dev: DEV, name: user.email.split("@")[0], updatedAt: fb.serverTimestamp() }, { merge: true });
    setState("synced");
  } catch (e) { lastErr = (e && e.code) || "unknown"; setState(navigator.onLine ? "error" : "offline"); }
}
// called by the app whenever progress changes
window.__tatTouch = k => {
  if (!Object.values(KEYS).includes(k)) return;
  setLocalT(Date.now());
  if (!user) return;
  clearTimeout(timer); timer = setTimeout(pushNow, 1200);
};
window.addEventListener("online", () => { if (user) pushNow(); else if (!fb && cfg) boot(); });
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && user && timer) pushNow(); });

async function logout() {
  if (unsub) unsub(); unsub = null;
  try { await fb.signOut(fb.auth); } catch (e) {}
  localStorage.removeItem("fc3-sync-uid");          // keep progress on this device; next login merges
  toast("ออกจากระบบแล้ว (ความคืบหน้าในเครื่องยังอยู่)");
}

async function boot() {
  setState("init");
  try {
    const [A, U, F] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FB}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FB}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${FB}/firebase-firestore.js`)]);
    const app = A.initializeApp(cfg);
    fb = { auth: U.getAuth(app), db: F.getFirestore(app), signInWithEmailAndPassword: U.signInWithEmailAndPassword,
      createUserWithEmailAndPassword: U.createUserWithEmailAndPassword, signOut: U.signOut,
      doc: F.doc, getDoc: F.getDoc, setDoc: F.setDoc, onSnapshot: F.onSnapshot, serverTimestamp: F.serverTimestamp };
    U.onAuthStateChanged(fb.auth, u => { if (u) start(u); else { user = null; ref = null; if (window.TatRole) TatRole.fromUser(null); setState("out"); } });
  } catch (e) { setState("loaderr"); }
}

/* sheet container (once) */
const lg = document.createElement("div"); lg.className = "lgwrap"; lg.id = "lg";
lg.innerHTML = `<div class="lgbox" id="lgBox"></div>`; document.body.appendChild(lg);
lg.addEventListener("click", e => { if (e.target === lg) closeSheet(); });

window.TatSync = { refresh: render, username: () => user ? user.email.split("@")[0] : "",
  pushProfile: p => { clearTimeout(ptimer); ptimer = setTimeout(() => pushProfileNow(p), 600); } };
if (cfg && cfg.apiKey) boot(); else setState("nocfg");
