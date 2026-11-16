/* ฟังการเปลี่ยน # + จุดเชื่อมกับ sync + เริ่มแอป — โหลดเป็นไฟล์สุดท้าย */
window.addEventListener("hashchange",()=>{ const h=parseHash(); if(!h) return;
  if(h.page==="lit"){ if(S.view!=="lit") showView("lit",h); else L.enter(h); return; }
  if(h.page==="home"||h.page==="write"||h.page==="profile"||h.page==="vpick"){ if(S.view!==h.page) showView(h.page); return; }
  if(h.ch!==S.ch){S.ch=h.ch;store.set("fc3-ch",S.ch)}
  if(h.cards && S.view!=="cards") startStudy(); else if(!h.cards && S.view!=="list") showView("list"); else renderList(true); });

/* ---------- hooks for ☁️ sync (js/services/sync.js) ---------- */
window.TatApp={
  toast,
  reload(){
    status=store.get("fc3-status",{})||{}; stars=new Set(store.get("fc3-star",[])||[]); W.reloadRes(); L.reload();
    if(S.view==="list") renderList(); else if(S.view==="vpick") renderVPick(); else if(S.view==="home") renderHome(); else if(S.view==="cards"){ S.shuffled=store.get("fc3-shuf",false); renderTools(); resumeReapply(); show(); } else if(S.view==="write") W.enter(); else if(S.view==="profile") renderProfile();
  },
  go(v){ setHash(v); showView(v); },
  profileChanged(){ if(S.view==="profile") renderProfile(); }
};

/* ---------- boot ---------- */
(function(){ const h=parseHash();
  if(!h||h.page==="home"){ goHome(); return; }
  if(h.page==="write"||h.page==="profile"||h.page==="lit"||h.page==="vpick"){ showView(h.page,h); return; }
  S.ch=h.ch; store.set("fc3-ch",S.ch); showView("list"); if(h.cards) startStudy(); })();
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}
