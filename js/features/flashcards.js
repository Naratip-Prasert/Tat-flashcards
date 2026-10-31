/* แฟลชการ์ด (#ch1-cards) + ป๊อปอัพฉลองจำครบ */
/* ================= CARD VIEW ================= */
function startStudy(){
  deck=listItems(); if(!deck.length) return;
  const ch=curCh(), sec=ch.secs.find(s=>s.id===curSec());
  const parts=[sec?sec.th:"ทั้งบท"]; if(S.starOnly) parts.push("★ ติดดาว"); if(S.stat) parts.push(ST[S.stat].th); if(S.q) parts.push(`"${S.q}"`);
  studyLabel=`<b>บท ${ch.no} <span class="jp">${ch.jp}</span></b>${esc(parts.join(" · "))}`;
  if(S.hide){ const d=deck.filter(c=>stOf(c)!=="k"); if(d.length) deck=d; }
  if(S.shuffled) shuffle(deck);
  idx=0; showView("cards"); setHash(S.ch+"-cards");
}
function shuffle(d){for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]]}}
$("backBtn").onclick=backToList; $("emptyBack").onclick=backToList;

function wordSize(w){const n=[...w].length; return n<=2?72:n<=4?60:n<=6?48:n<=8?40:n<=11?32:n<=15?27:23}
function thaiSize(t){const n=[...t].length; return n<=8?38:n<=14?32:n<=22?27:n<=30?23:20}
const jpBlock=c=>`<div class="word jp" style="font-size:${wordSize(c.w)}px">${esc(c.w)}</div>`+(c.r?`<div class="reading jp">(${esc(c.r)})</div>`:"");
const thBlock=c=>`<div class="thai" style="font-size:${thaiSize(c.th)}px">${esc(c.th)}</div>`;

function renderTools(){
  $("dirBtn").innerHTML = S.dir==="jp" ? `<span class="jp">あ</span>` : `<span>ก</span>`;
  $("shufBtn").classList.toggle("on",S.shuffled);
  $("hideBtn").classList.toggle("on",S.hide);
}
function show(){
  const has=deck.length>0;
  $("stage").style.display=has?"":"none"; $("nav").style.visibility=has?"":"hidden";
  $("empty").style.display=has?"none":"flex";
  const k=deck.filter(c=>stOf(c)==="k").length, l=deck.filter(c=>stOf(c)==="l").length, n=deck.length||1;
  const bars=$("cbar").children; bars[0].style.width=(k/n*100)+"%"; bars[1].style.width=(l/n*100)+"%";
  $("knownCt").textContent=`จำได้ ${k}/${deck.length}`;
  if(!has){$("pos").textContent="0 / 0";return}
  const c=deck[idx], st=stOf(c);
  $("pos").textContent=`${idx+1} / ${deck.length}`;
  const tag=`<div class="tag"><b class="jp">${esc(c.secJp)}</b>${esc(c.secTh)} · ${c.no}</div>`;
  const act=`<div class="fact"><button class="ic spk" data-a="spk" aria-label="ฟังเสียง">${IC.spk}</button><button class="ic star ${stars.has(c.id)?"on":""}" data-a="star" aria-label="ติดดาว">${IC.star}</button></div>`;
  const pill=st!=="n"?`<div class="pill ${st}">${ST[st].th}</div>`:"";
  const extra=(c.ex?`<div class="ex"><span>ตัวอย่าง</span><span class="jp" style="display:inline;font-size:14px;color:var(--ink);font-weight:400">${esc(c.ex)}</span></div>`:"")+
              (c.note?`<div class="note"><b>หมายเหตุ:</b> ${esc(c.note)}</div>`:"");
  const front=tag+act+pill+`<div class="fin">`+(S.dir==="jp"?jpBlock(c):thBlock(c))+`</div><div class="hint">แตะเพื่อดูคำตอบ</div>`;
  const back=tag+act+pill+`<div class="fin">`+(S.dir==="jp"
    ? thBlock(c)+`<div class="sub jp">${esc(c.w)}${c.r?" ("+esc(c.r)+")":""}</div>`+extra
    : jpBlock(c)+`<div class="sub">${esc(c.th)}</div>`+extra)+`</div>`;
  sides={front,back}; flipped=false; paint();
}
let sides={front:"",back:""}, turning=false;
function paint(){ const f=$("face"); f.innerHTML=flipped?sides.back:sides.front; f.classList.toggle("isback",flipped); f.scrollTop=0; }
function flip(){
  if(turning) return; turning=true;
  const card=$("card"); card.classList.add("turn");
  setTimeout(()=>{ flipped=!flipped; paint(); card.classList.remove("turn"); turning=false; },140);
}
$("card").addEventListener("click",e=>{
  const a=e.target.closest("[data-a]");
  if(a){ const c=deck[idx];
    if(a.dataset.a==="spk") speak(c,a);
    else { if(stars.has(c.id)) stars.delete(c.id); else stars.add(c.id); saveStars();
      const on=stars.has(c.id); document.querySelectorAll('#card [data-a="star"]').forEach(b=>b.classList.toggle("on",on));
      ["front","back"].forEach(k=>sides[k]=sides[k].replace(/class="ic star( on)?"/,`class="ic star${on?" on":""}"`));
      toast(stars.has(c.id)?"ติดดาวแล้ว":"เอาดาวออกแล้ว"); }
    return; }
  flip();
});
function go(n){ if(!deck.length)return; idx=(idx+n+deck.length)%deck.length; show(); }
function mark(ok){
  if(!deck.length)return;
  const c=deck[idx], was=stOf(c); status[c.id]=ok?"k":"l"; saveStatus();
  if(S.hide&&ok){ deck.splice(idx,1); if(idx>=deck.length) idx=0; show(); } else go(1);
  if(ok && was!=="k") checkDone(c);
}

/* ---------- celebration when a section / whole chapter is fully memorised ---------- */
function checkDone(c){
  const ch=CH.find(x=>x.id===c.ch);
  const chAll=ALL.filter(x=>x.ch===c.ch);
  if(chAll.every(x=>stOf(x)==="k")) { celebrate(ch); return; }
  const secAll=ALL.filter(x=>x.ch===c.ch&&x.sec===c.sec);
  if(secAll.every(x=>stOf(x)==="k")) { toast(`🎉 จำหมวด ${c.secJp} ครบแล้ว!`); confetti(900); }
}
function celebrate(ch){
  $("celeTitle").innerHTML=`จำบท ${ch.no} <span class="jp">${ch.jp}</span><br>ได้หมดแล้ว!`;
  const n=ALL.filter(x=>x.ch===ch.id).length;
  $("celeSub").textContent=`${ch.th} · ครบทั้ง ${n} คำ`;
  const next=CH.find(x=>x.no>ch.no && !ALL.filter(y=>y.ch===x.id).every(y=>stOf(y)==="k"));
  $("celeBtns").innerHTML=(next?`<button class="pri" data-go="${next.id}">ไปบท ${next.no} <span class="jp">${next.jp}</span> ต่อ</button>`:"")+
    `<button class="${next?"":"pri"}" data-go="list">กลับไปหน้ารวม</button><button data-go="stay">อยู่หน้านี้ต่อ</button>`;
  $("cele").classList.add("on"); confetti(2600);
}
$("celeBtns").onclick=e=>{
  const b=e.target.closest("button"); if(!b) return;
  $("cele").classList.remove("on");
  const g=b.dataset.go;
  if(g==="list") backToList();
  else if(g!=="stay"){ S.ch=g; store.set("fc3-ch",g); S.stat=null; S.starOnly=false; S.q=""; $("q").value=""; setHash(g); showView("list"); $("scroll").scrollTop=0; }
};
$("cele").onclick=e=>{ if(e.target.id==="cele") $("cele").classList.remove("on"); };
$("prevBtn").onclick=()=>go(-1); $("nextBtn").onclick=()=>go(1);
$("goodBtn").onclick=()=>mark(true); $("badBtn").onclick=()=>mark(false);
$("dirBtn").onclick=()=>{S.dir=S.dir==="jp"?"th":"jp";store.set("fc3-dir",S.dir);renderTools();show();toast(S.dir==="jp"?"ด้านหน้า: ภาษาญี่ปุ่น":"ด้านหน้า: ภาษาไทย")};
$("shufBtn").onclick=()=>{S.shuffled=!S.shuffled; if(S.shuffled) shuffle(deck); else deck.sort((a,b)=>a.ord-b.ord); idx=0; renderTools(); show(); toast(S.shuffled?"สุ่มลำดับแล้ว":"เรียงตามชีท")};
$("hideBtn").onclick=()=>{S.hide=!S.hide;store.set("fc3-hide",S.hide);
  if(S.hide){ const cur=deck[idx]; deck=deck.filter(c=>stOf(c)!=="k"); idx=Math.max(0,deck.indexOf(cur)); }
  else { const cur=deck[idx]; deck=listItems(); if(S.shuffled) shuffle(deck); idx=Math.max(0,deck.indexOf(cur)); }
  renderTools(); show(); toast(S.hide?"ซ่อนคำที่จำได้แล้ว":"แสดงทุกคำ")};
document.addEventListener("keydown",e=>{
  if(S.view!=="cards") return;
  if(e.key===" "||e.key==="Enter"){e.preventDefault();flip()}
  else if(e.key==="ArrowRight")go(1); else if(e.key==="ArrowLeft")go(-1);
  else if(e.key==="1")mark(false); else if(e.key==="2")mark(true); else if(e.key==="Escape")backToList();
});
let sx=null,sy=null;
$("stage").addEventListener("touchstart",e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
$("stage").addEventListener("touchend",e=>{
  if(sx==null)return; const dx=e.changedTouches[0].clientX-sx, dy=e.changedTouches[0].clientY-sy; sx=null;
  if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.3){e.preventDefault();go(dx<0?1:-1)}
});
