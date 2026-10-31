/* ข้อมูลคำศัพท์ (ALL), ที่เก็บในเครื่อง (store), สถานะจำได้/ติดดาว, ตัวช่วยเล็ก ๆ */
const CH = window.VOCAB;
const ALL = [];
CH.forEach(ch => ch.secs.forEach(s => s.items.forEach((it,i) => ALL.push({
  id:ch.id+"-"+s.id+"-"+(i+1), ch:ch.id, sec:s.id, secJp:s.jp, secTh:s.th, no:i+1, ord:ALL.length,
  w:it.w, r:it.r||"", th:it.th, note:it.note||"", ex:it.ex||""
}))));

/* ---------- storage ---------- */
const store = {
  get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){} if(window.__tatTouch) window.__tatTouch(k);}
};
let status = store.get("fc3-status", null);           // id -> "k" (จำได้) | "l" (กำลังเรียน)
if(!status){ status={}; store.get("fc2-known",[]).forEach(id=>status[id]="k"); }
let stars = new Set(store.get("fc3-star",[]));
const saveStatus=()=>store.set("fc3-status",status), saveStars=()=>store.set("fc3-star",[...stars]);

const ids = new Set(CH.map(c=>c.id));
let S = {
  ch: store.get("fc3-ch","ch1"), secBy: store.get("fc3-sec",{}), stat:null, starOnly:false,
  sort: store.get("fc3-sort","sheet"), q:"",
  dir: store.get("fc3-dir","jp"), hide: store.get("fc3-hide",false), shuffled:false, view:"list"
};
let deck=[], idx=0, flipped=false, studyLabel="";

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const curCh = () => CH.find(c=>c.id===S.ch);
const curSec = () => S.secBy[S.ch]||"all";
const stOf = c => status[c.id]||"n";
const ST = {n:{th:"ยังไม่เริ่ม",c:"var(--new)"}, l:{th:"กำลังเรียน",c:"var(--bad)"}, k:{th:"จำได้แล้ว",c:"var(--good)"}};
let tt; function toast(m){const el=$("toast");el.textContent=m;el.classList.add("show");clearTimeout(tt);tt=setTimeout(()=>el.classList.remove("show"),1500)}
