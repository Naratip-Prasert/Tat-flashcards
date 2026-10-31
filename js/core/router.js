/* ตัวสลับหน้า: #home #ch1 #ch1-cards #write #profile — โหลดก่อนไฟล์ฟีเจอร์ */
/* ---------- routing (#ch1 = list, #ch1-cards = flashcards) ---------- */
function parseHash(){ const h=location.hash.slice(1); if(h==="home"||h==="write"||h==="profile") return {page:h};
  const m=h.match(/^(ch\d)(-cards)?$/); return m&&ids.has(m[1])?{page:m[2]?"cards":"list",ch:m[1],cards:!!m[2]}:null; }
function setHash(h){ try{ history.replaceState(null,"","#"+h) }catch(e){} }

const VIEWS={home:"homeView",list:"listView",cards:"cardView",write:"writeView",profile:"profileView"};
function placeClock(v){ const slot=document.querySelector(`[data-clock="${v}"]`), c=$("clock"); if(slot&&c.parentElement!==slot){ slot.appendChild(c); } c.classList.toggle("mini",v!=="home"); }
function showView(v){
  if(v==="write"&&!can("write")) v="home", setHash("home");
  S.view=v; Object.entries(VIEWS).forEach(([k,id])=>$(id).classList.toggle("on",k===v)); placeClock(v);
  if(v!=="write") W.stopMic();
  if(v==="cards"){ $("cTitle").innerHTML=studyLabel; renderTools(); show(); return; }
  try{speechSynthesis.cancel()}catch(e){}
  if(v==="list") renderList(); else if(v==="home") renderHome(); else if(v==="write") W.enter(); else if(v==="profile") renderProfile();
}
function goHome(){ setHash("home"); showView("home"); }
function backToList(){ setHash(S.ch); showView("list"); }
