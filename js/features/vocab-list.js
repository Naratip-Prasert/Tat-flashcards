/* หน้ารวมคำศัพท์ (#ch1 …): ตัวกรอง/ค้นหา/เรียงลำดับ/ติดดาว */
/* ---------- scope & list filtering ---------- */
const inSec = c => c.ch===S.ch && (curSec()==="all"||c.sec===curSec());
const norm = s => s.toLowerCase().replace(/[\s〜~{}（）()・]/g,"");
function listItems(){
  let a = ALL.filter(inSec);
  if(S.exMode) a=a.filter(c=>c.ex);
  if(S.starOnly) a=a.filter(c=>stars.has(c.id));
  if(S.stat) a=a.filter(c=>stOf(c)===S.stat);
  if(S.q){ const q=norm(S.q); a=a.filter(c=>norm(c.w+c.r+c.th).includes(q)); }
  const rank={l:0,n:1,k:2};
  if(S.sort==="star") a.sort((x,y)=>(stars.has(y.id)-stars.has(x.id))||x.ord-y.ord);
  if(S.sort==="weak") a.sort((x,y)=>(rank[stOf(x)]-rank[stOf(y)])||x.ord-y.ord);
  return a;
}

/* ================= LIST VIEW ================= */
function renderTabs(){
  const c=curCh();
  $("tabs").innerHTML=`<button class="tab on chhead" aria-label="เปลี่ยนหมวด">
    <span class="t1"><span class="jp">${c.jp}</span> <span class="chsw">▾</span></span>
    <span class="t2">${esc(c.th)}</span></button>`;
  $("tabs").firstChild.onclick=()=>{ setHash("vocab"); showView("vpick"); };
}
function ring(n,total,color){
  const r=17, C=2*Math.PI*r, f=total?n/total:0;
  return `<div class="ring"><svg viewBox="0 0 42 42"><circle cx="21" cy="21" r="${r}" fill="none" stroke="var(--line)" stroke-width="4"/>
    <circle cx="21" cy="21" r="${r}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(C*f).toFixed(1)} ${C.toFixed(1)}"/></svg><b>${n}</b></div>`;
}
function renderStats(){
  const scope=ALL.filter(c=>inSec(c)&&(!S.exMode||c.ex)), cnt={n:0,l:0,k:0}; scope.forEach(c=>cnt[stOf(c)]++);
  $("stats").innerHTML=["n","l","k"].map(k=>`<button class="stat ${S.stat===k?"on":""}" data-s="${k}">${ring(cnt[k],scope.length,ST[k].c)}
    <span class="lb"><strong>${ST[k].th}</strong>${cnt[k]} / ${scope.length}</span></button>`).join("");
  $("stats").querySelectorAll(".stat").forEach(b=>b.onclick=()=>{ S.stat = S.stat===b.dataset.s?null:b.dataset.s; renderList(); });
}
function renderChips(){
  const ch=curCh(), items=ALL.filter(c=>c.ch===ch.id&&(!S.exMode||c.ex));
  const secN=s=>S.exMode?s.items.filter(x=>x.ex).length:s.items.length;
  const opts=[["all","ทั้งหมด",items.length],...ch.secs.filter(s=>secN(s)).map(s=>[s.id,`<span class="jp">${s.jp}</span> ${s.th}`,secN(s)])];
  const nStar=items.filter(c=>stars.has(c.id)).length;
  $("chips").innerHTML = `<button class="chip ${S.starOnly?"on":""}" id="starChip">★ ติดดาว<span class="n">${nStar}</span></button>` +
    opts.map(([k,l,n])=>`<button class="chip ${curSec()===k?"on":""}" data-k="${k}">${l}<span class="n">${n}</span></button>`).join("");
  $("starChip").onclick=()=>{S.starOnly=!S.starOnly;renderList()};
  $("chips").querySelectorAll(".chip[data-k]").forEach(b=>b.onclick=()=>{S.secBy[S.ch]=b.dataset.k;store.set("fc3-sec",S.secBy);renderList()});
}
function exItemHtml(c){
  const st=stOf(c);
  return `<div class="item exitem" data-id="${c.id}">${st!=="n"?`<span class="st ${st}"></span>`:""}
    <div class="irow"><div class="itxt"><div class="exs jp">${esc(c.ex)}</div></div>
      <div class="iact"><button class="ic spk exspk" aria-label="ฟังประโยค">${IC.spk}</button><button class="ic star ${stars.has(c.id)?"on":""}" aria-label="ติดดาว">${IC.star}</button></div></div>
    <div class="exw"><span class="jp">${esc(c.w)}</span>${c.r?` <span class="jp exr">${esc(c.r)}</span>`:""} · ${esc(c.th)}</div></div>`;
}
function itemHtml(c){
  if(S.exMode) return exItemHtml(c);
  const st=stOf(c);
  const det=(c.ex?`<div><span class="lbl">ตัวอย่าง</span><span class="jp">${esc(c.ex)}</span></div>`:"")+(c.note?`<div><span class="lbl">หมายเหตุ</span>${esc(c.note)}</div>`:"");
  return `<div class="item" data-id="${c.id}">${st!=="n"?`<span class="st ${st}"></span>`:""}
    <div class="irow"><div class="itxt"><div class="iw jp">${esc(c.w)}</div>${c.r?`<div class="ir jp">${esc(c.r)}</div>`:""}</div>
      <div class="iact"><button class="ic spk" aria-label="ฟังเสียง">${IC.spk}</button><button class="ic star ${stars.has(c.id)?"on":""}" aria-label="ติดดาว">${IC.star}</button></div></div>
    <div class="ith">${esc(c.th)}</div>${det?`<div class="idet">${det}</div>`:""}</div>`;
}
function exBtn(){ const n=ALL.filter(c=>c.ch===S.ch&&c.ex).length, b=$("exBtn");
  if(!n&&S.exMode) S.exMode=false;
  b.hidden=!n; b.classList.toggle("on",!!S.exMode); b.setAttribute("aria-pressed",!!S.exMode); $("exN").textContent=n; }
$("exBtn").onclick=()=>{ S.exMode=!S.exMode;
  if(S.exMode){ const sec=curSec(); if(sec!=="all"&&!ALL.some(c=>c.ch===S.ch&&c.sec===sec&&c.ex)){ S.secBy[S.ch]="all"; store.set("fc3-sec",S.secBy); } }
  renderList(true); toast(S.exMode?"โชว์เฉพาะคำที่มีตัวอย่างประโยค 📝":"กลับไปลิสต์คำศัพท์ทั้งหมด"); };
function renderList(resetScroll){
  exBtn(); renderTabs(); renderStats(); renderChips();
  const ch=curCh();
  $("lTitle").innerHTML=S.exMode?`<span class="jp">例文</span> <span style="font-size:14px;font-weight:500;color:var(--muted)">ตัวอย่างประโยค</span>`:`<span class="jp">用語</span> <span style="font-size:14px;font-weight:500;color:var(--muted)">คำศัพท์</span>`;
  $("sortSel").value=S.sort;
  const a=listItems();
  $("items").innerHTML = a.length ? a.map(itemHtml).join("") : `<div class="nores">ไม่มีคำที่ตรงกับตัวกรองนี้</div>`;
  const sb=$("studyBtn");
  sb.disabled=!a.length;
  const rp=a.length&&typeof resumePeek==="function"?resumePeek():{i:0};
  sb.innerHTML=rp.i>0?`ทบทวนต่อ <small>· ใบที่ ${rp.i+1} / ${rp.n}</small>`:`ทบทวนชุดนี้ <small>· ${a.length} คำ</small>`;
  $("restartBtn").disabled=!a.length;
  $("qclr").style.display=S.q?"block":"none";
  if(resetScroll) $("scroll").scrollTop=0;
}
$("items").addEventListener("click",e=>{
  const it=e.target.closest(".item"); if(!it) return;
  const c=ALL.find(x=>x.id===it.dataset.id);
  if(e.target.closest(".exspk")){ speak({w:c.ex},e.target.closest(".exspk")); return; }
  if(e.target.closest(".spk")){ speak(c,e.target.closest(".spk")); return; }
  if(e.target.closest(".star")){ const b=e.target.closest(".star");
    if(stars.has(c.id)){stars.delete(c.id);b.classList.remove("on")} else {stars.add(c.id);b.classList.add("on")}
    saveStars(); renderChips(); return; }
  it.classList.toggle("open");
});
$("sortSel").onchange=e=>{S.sort=e.target.value;store.set("fc3-sort",S.sort);renderList()};
$("q").oninput=e=>{S.q=e.target.value.trim();renderList()};
$("qclr").onclick=()=>{S.q="";$("q").value="";renderList()};
let armed=false;
$("resetCh").onclick=()=>{
  if(!armed){armed=true;$("resetCh").textContent="แตะอีกครั้งเพื่อยืนยันการล้าง";setTimeout(()=>{armed=false;$("resetCh").textContent="ล้างสถานะการเรียนของบทนี้"},3000);return}
  armed=false;$("resetCh").textContent="ล้างสถานะการเรียนของหมวดนี้";
  ALL.filter(c=>c.ch===S.ch).forEach(c=>delete status[c.id]); saveStatus(); renderList(); toast("ล้างแล้ว");
};
$("studyBtn").onclick=()=>startStudy();
$("restartBtn").onclick=e=>confirmTap(e.currentTarget,"↺ เริ่มใหม่",restartStudy);
