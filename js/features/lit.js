/* 📜 Hist Jap Lit — หน้าเลือกหมวด → แฟลชการ์ด + สรุป/รายการคำ ของแต่ละหมวด
   ข้อมูลแต่ละหมวดอยู่ใน data/lit-*.js (window.LIT_SETS)
     kind:"story" = แบบเรื่องเล่า มีเรื่อง/หมวดย่อย + สรุปเรื่อง (อุจิ)
     kind:"terms" = แบบคำ → คำอธิบาย (ชุดจาก Quizlet)
   ลิงก์: #lit (เลือกหมวด) · #lit-<id> (การ์ด) · #lit-<id>-sum (สรุป/รายการคำ)
   สถานะ: fc3-lit = { cardId: "k"|"u" }, fc3-lit-star = [cardId]  ← ซิงก์ข้ามเครื่อง (id ไม่ซ้ำข้ามหมวด) */
const LIT_ST=ST;                                   // สถานะ ยังไม่เริ่ม/กำลังเรียน/จำได้ (ก่อนถูกบัง)
const L=(()=>{
  const SETS=(window.LIT_SETS||[]).slice().sort((a,b)=>(a.order||9)-(b.order||9));
  const BY=Object.fromEntries(SETS.map(s=>[s.id,s]));
  let mark=store.get("fc3-lit",{})||{}, lstars=new Set(store.get("fc3-lit-star",[])||[]);
  let notes=store.get("fc3-lit-note",{})||{};       // 📝 โน้ตของฉัน (ต่อการ์ด) — เก็บในบัญชี/เครื่อง ไม่ได้อยู่ในโค้ดเว็บ
  let prefAll=store.get("fc3-lit-f",{})||{};
  if("s" in prefAll||"c" in prefAll) prefAll={uji:{s:prefAll.s,c:prefAll.c}};          // old single-set format
  const savePref=()=>{ prefAll[D.id]={s:fStory,c:fCat,r:rev}; store.set("fc3-lit-f",prefAll); };

  let D=null, CARDS=[], BYID={}, ST={}, CATN={}, GN={};
  let fStory="all", fCat="all", rev=false, onlyUnsure=false, onlyStar=false, order=[], idx=0, flipped=false, turning=false, tab="cards", page="pick";

  const known=cs=>cs.filter(c=>mark[c.id]==="k").length;
  const starredIn=cs=>cs.filter(c=>lstars.has(c.id)).length;
  const hasSum=d=>d.kind==="story"||!!d.summary;
  const grpOf=c=>D.kind==="story"?c.s:c.g;
  let deck=null;                                   // Set ของ id จากปุ่ม "ทบทวนชุดนี้" ในลิสต์รวม (null = ใช้ตัวกรองปกติ)
  const list=()=>order.map(id=>BYID[id]).filter(c=>c&&(deck?deck.has(c.id):(fStory==="all"||String(grpOf(c))===String(fStory))&&(fCat==="all"||c.cat===fCat))&&(!onlyUnsure||mark[c.id]!=="k")&&(!onlyStar||lstars.has(c.id)));

  /* ---------- หน้าเลือกหมวด ---------- */
  function renderPick(){
    $("lPick").innerHTML=`<div class="lpick-h">เลือกหมวดที่จะทบทวน</div>`+SETS.map(s=>{
      const n=s.cards.length, k=known(s.cards), st=starredIn(s.cards), ready=n>0;
      return `<button class="lset${ready?"":" soon"}" data-set="${s.id}" style="--sc:${s.color}">
        <span class="lset-ic">${s.icon}</span>
        <span class="lset-t"><b>${esc(s.title)}</b><span class="jp">${s.jp}</span>
          <span class="lset-m">${ready?`${n} การ์ด · จำได้ ${k}${st?` · ⭐ ${st}`:""}`:"เร็ว ๆ นี้ — กำลังเพิ่มการ์ด"}</span>
          ${ready?`<span class="lset-bar"><i style="width:${k/n*100}%"></i></span>`:""}</span>
        <span class="lchev">›</span></button>`; }).join("");
  }
  $("lPick").onclick=e=>{ const b=e.target.closest(".lset"); if(!b) return;
    if(b.classList.contains("soon")){ toast("หมวดนี้ยังไม่มีการ์ด เร็ว ๆ นี้นะ 🙏"); return; }
    openSet(b.dataset.set,"list"); };

  function showPick(){
    page="pick"; setHash("lit");
    $("litView").classList.remove("lc"); $("lPick").hidden=false; $("lSet").hidden=true;
    $("litTitle").textContent="Hist Jap Lit 📜"; $("litSub").textContent="วรรณคดีญี่ปุ่น · เลือกหมวด"; $("liCta").hidden=true;
    renderPick(); $("lScroll").scrollTop=0;
  }

  /* ---------- เปิดหมวด ---------- */
  function useSet(id){
    D=BY[id]; CARDS=D.cards; BYID=Object.fromEntries(CARDS.map(c=>[c.id,c]));
    ST=D.stories?Object.fromEntries(D.stories.map(s=>[s.id,s])):{}; ST[0]={id:0,t:"ภาพรวม",c:"#5a4a5f"};
    CATN=D.cats?Object.fromEntries(D.cats.map(c=>[c.k,c.n])):{}; GN=D.groups?Object.fromEntries(D.groups.map(g=>[g.k,g.n])):{};
    const p=prefAll[id]||{};
    fStory=(D.stories||D.groups)?(p.s??"all"):"all"; fCat=D.cats?(p.c||D.cats[0].k):"all"; rev=!!p.r;
    order=CARDS.map(c=>c.id); const RS=litRes()[id]; if(RS&&RS.order){ const known=new Set(order); const kept=RS.order.filter(x=>known.has(x)), ks=new Set(kept); order=[...kept,...order.filter(x=>!ks.has(x))]; }
    idx=0; flipped=false; onlyUnsure=false; onlyStar=false; deck=null; LF={g:"all",star:false,stat:null,q:""}; $("liQ").value="";
    $("lUnsure").classList.remove("on"); $("lDeck").innerHTML="";
    $("lSumTab").textContent="📖 สรุป"; $("lSumTab").hidden=!hasSum(D);
    $("lTabs").style.gridTemplateColumns=hasSum(D)?"repeat(4,1fr)":"repeat(3,1fr)";
    QZ.stage="setup"; QZ.g="all"; QZ.src="all"; QZ.n=10;
    $("lFilt").hidden=!(D.kind==="story"||D.groups); $("lStoryLab").textContent=D.kind==="story"?"เรื่อง":"หัวข้อ";
    $("lCatLab").hidden=$("lCat").hidden=D.kind!=="story"; $("lRev").hidden=D.kind!=="terms"; $("lRev").classList.toggle("on",rev);
  }
  function openSet(id,t){ if(t==="sum"&&BY[id]&&!hasSum(BY[id])) t="list"; if(t==="quiz"&&D&&D.id===id&&QZ.stage!=="setup"&&tab==="quiz") return; if(!BY[id]||!BY[id].cards.length){ showPick(); return; }
    const fresh=!D||D.id!==id; if(fresh) useSet(id);
    page="set"; $("lPick").hidden=true; $("lSet").hidden=false;
    if((t||"list")==="cards"&&(fresh||tab!=="cards")) idx=resumeIdx();
    $("litTitle").textContent=D.title; $("litSub").textContent=`${D.jp} · ${D.sub||""}`;
    setTab(t||"list"); }

  /* ---------- chips (เฉพาะแบบเรื่องเล่า) ---------- */
  function chip(label,val,cur,color,fn){ const b=document.createElement("button"); b.className="lchip"+(String(val)===String(cur)?" on":"");
    b.innerHTML=(color?`<i style="background:${color}"></i>`:"")+label; b.onclick=fn; return b; }
  function renderChips(){
    const a=$("lStory"), b=$("lCat"); a.innerHTML=""; b.innerHTML="";
    if(D.groups){ a.append(chip("ทั้งหมด","all",fStory,null,()=>pick("all","all")));
      D.groups.forEach(g=>a.append(chip(`${esc(g.n)} <small>${CARDS.filter(c=>c.g===g.k).length}</small>`,g.k,fStory,null,()=>pick(g.k,"all")))); return; }
    if(D.kind!=="story") return;
    a.append(chip("ทั้งหมด","all",fStory,null,()=>pick("all",fCat)));
    D.stories.forEach(s=>a.append(chip(`${s.id}. ${esc(s.t)}`,s.id,fStory,s.c,()=>pick(s.id,fCat))));
    a.append(chip("ภาพรวม/เปรียบเทียบ",0,fStory,ST[0].c,()=>pick(0,fCat)));
    b.append(chip("ทุกหมวด","all",fCat,null,()=>pick(fStory,"all")));
    D.cats.forEach(c=>b.append(chip(c.n,c.k,fCat,null,()=>pick(fStory,c.k))));
  }
  function pick(s,c){ fStory=s; fCat=c; savePref(); idx=resumeIdx(); flipped=false; renderChips(); render(); }
  /* ▶ ทวนต่อจากเดิม: fc3-lit-resume = { setId: {order:[id], pos:{ตัวกรอง: id ใบล่าสุด}} } */
  const litRes=()=>store.get("fc3-lit-resume",{})||{};
  const fkey=()=>deck?"deck:"+[...deck].join(","):[fStory,fCat,onlyUnsure?1:0,onlyStar?1:0].join("|");
  /* t = เวลาที่ผู้ใช้ขยับการ์ดจริง (ซิงก์: ใหม่กว่าชนะ) · ตำแหน่งแรกที่สร้างเองไม่อัปเดต t จะได้ไม่ทับอีกเครื่อง */
  function saveLitRes(withOrder,force){ if(!D) return; const L2=list(); const all=litRes(), r=all[D.id]||{pos:{},t:0};
    r.pos=r.pos||{}; const fk=fkey(), id=L2[idx]?L2[idx].id:null, prevId=r.pos[fk];
    const changed=id!=null&&prevId!==id, ordCh=withOrder&&JSON.stringify(r.order||null)!==JSON.stringify(order);
    if(!changed&&!ordCh&&!force) return;
    if(id!=null) r.pos[fk]=id; if(withOrder) r.order=order.slice();
    if(force||ordCh||(changed&&prevId!=null)) r.t=Date.now(); else r.t=r.t||0;
    const pk=Object.keys(r.pos); if(pk.length>30) delete r.pos[pk[0]];
    all[D.id]=r; store.set("fc3-lit-resume",all); }
  function applyOrder(){ order=CARDS.map(c=>c.id); const RS=litRes()[D.id]; if(RS&&RS.order){ const known=new Set(order); const kept=RS.order.filter(x=>known.has(x)), ks=new Set(kept); order=[...kept,...order.filter(x=>!ks.has(x))]; } }
  function resumeIdx(){ if(!D) return 0; const r=litRes()[D.id], id=r&&r.pos&&r.pos[fkey()]; if(id==null) return 0;
    const L2=list(), i=L2.findIndex(c=>c.id===id); if(i>=0) return i;
    const at=order.indexOf(id); if(at>=0) for(let k=at+1;k<order.length;k++){ const j=L2.findIndex(c=>c.id===order[k]); if(j>=0) return j; }
    return 0; }

  /* ---------- การ์ด ---------- */
  function sides(c){
    const m=mark[c.id];
    const st=m==="k"?'<span class="ltag ok">✓ จำได้</span>':m==="u"?'<span class="ltag un">ยังไม่แม่น</span>':"";
    const nb=noteHtml(c);
    if(D.poem){                                       // หมวดกลอน: หน้า = บทต้นฉบับ · หลัง = คำแปล/ผู้แต่ง/เรื่อง/คุณค่า
      const lb=D.labels, meta=`<div class="lmeta"><span class="ltag">${rev?lb[1]:lb[0]}</span>${st}</div>`;
      const orig=`<div class="lpq">${c.q}</div>`, info=`<div class="lans"><div class="lqq">${c.t}</div>${nb}${c.a}</div>`;
      return rev?{ front:`${meta}<div class="lans">${c.a}</div><div class="lhint">แตะเพื่อดูบทต้นฉบับ</div>`, back:`${meta}${orig}` }
                :{ front:`${meta}${orig}<div class="lhint">แตะเพื่อดูคำแปล · ผู้แต่ง · คุณค่า</div>`, back:`${meta}${info}` };
    }
    if(D.kind==="terms"){
      const lb=D.labels||["คำ → คำอธิบาย","คำอธิบาย → คำ"], F=rev?c.a:c.q, B=rev?c.q:c.a;
      const meta=`<div class="lmeta">${c.g&&GN[c.g]?`<span class="ltag st">${esc(GN[c.g])}</span>`:""}<span class="ltag">${rev?lb[1]:lb[0]}</span>${st}</div>`;
      return { front:`${meta}<div class="lq lterm-q">${F}</div><div class="lhint">แตะเพื่อดูคำตอบ</div>`,
               back:`${meta}<div class="lans"><div class="lqq">${F.replace(/<[^>]+>/g,"")}</div><div class="lterm-a">${B}</div>${nb}</div>` };
    }
    const s=ST[c.s];
    // ด้านหน้าไม่บอกชื่อเรื่อง (ไม่งั้นเหมือนเฉลย) — ชื่อเรื่องโชว์ตอนพลิกดูคำตอบ
    const metaF=`<div class="lmeta"><span class="ltag">${CATN[c.cat]}</span>${st}</div>`;
    const meta=`<div class="lmeta"><span class="ltag st">${c.s?c.s+". "+esc(s.t):"ภาพรวม"}</span><span class="ltag">${CATN[c.cat]}</span>${st}</div>`;
    const plain=c.q.replace(/<small>.*?<\/small>/,"").replace(/<[^>]+>/g,"");
    return { front:`${metaF}<div class="lq">${c.q}</div><div class="lhint">แตะเพื่อดูคำตอบ</div>`,
             back:`${meta}<div class="lans"><div class="lqq">${esc(plain)}</div>${c.a}${nb}</div>` };
  }
  /* 📝 โน้ตของฉัน */
  function noteHtml(c){ const n=notes[c.id];
    return n?`<div class="lnote"><div class="lnh"><b>📝 โน้ตของฉัน</b><button class="lnbtn" data-note="${c.id}">✏️ แก้ไข</button></div><div class="lnotet">${esc(n)}</div></div>`
            :`<div class="lnote lnempty"><button class="lnbtn" data-note="${c.id}">📝 เพิ่มโน้ต${D.poem?" · เช่น คำแปลจากหนังสือ":""}</button></div>`; }
  const nw=document.createElement("div"); nw.className="lnwrap"; nw.id="lnWrap";
  nw.innerHTML=`<div class="lnbox"><div class="lnhd"><b id="lnT">📝 โน้ตของฉัน</b><button class="lnx" id="lnX" aria-label="ปิด">×</button></div>
    <textarea id="lnTa" rows="10" placeholder="พิมพ์โน้ตของการ์ดใบนี้ เช่น คำแปลจากหนังสือ / จุดที่อาจารย์เน้น"></textarea>
    <div class="lnsub">เก็บไว้ในบัญชีของเรา ซิงก์ข้ามเครื่อง · คนอื่นที่เปิดเว็บไม่เห็น</div>
    <div class="lnbtns"><button class="lndel" id="lnDel">ลบโน้ต</button><button class="lnsave" id="lnSave">บันทึก</button></div></div>`;
  document.body.appendChild(nw);
  let noteId=null;
  function openNote(id){ noteId=id; const c=BYID[id]; $("lnT").textContent="📝 โน้ต · "+((c&&(c.t||c.q.replace(/<[^>]+>/g,"")))||"").slice(0,40);
    $("lnTa").value=notes[id]||""; $("lnDel").hidden=!notes[id]; nw.classList.add("on"); setTimeout(()=>$("lnTa").focus(),60); }
  const closeNote=()=>{ nw.classList.remove("on"); noteId=null; };
  function saveNote(v){ if(noteId==null) return; v=(v||"").replace(/\s+$/,""); if(v) notes[noteId]=v; else delete notes[noteId];
    store.set("fc3-lit-note",notes); closeNote(); toast(v?"บันทึกโน้ตแล้ว 📝":"ลบโน้ตแล้ว");
    if(tab==="cards") paint(); else if(tab==="list") renderLL(); }
  $("lnX").onclick=closeNote; nw.addEventListener("click",e=>{ if(e.target===nw) closeNote(); });
  $("lnSave").onclick=()=>saveNote($("lnTa").value); $("lnDel").onclick=()=>saveNote("");
  document.addEventListener("click",e=>{ const b=e.target.closest("[data-note]"); if(!b||S.view!=="lit") return; e.stopPropagation(); openNote(isNaN(+b.dataset.note)||!BYID[+b.dataset.note]?b.dataset.note:+b.dataset.note); },true);
  const backColor=c=>D.kind==="story"?ST[c.s].c:D.color;
  function paint(){ const L2=list(); if(!L2.length) return; const c=L2[idx], f=$("lFace"), sd=sides(c);
    f.innerHTML=flipped?sd.back:sd.front; f.classList.toggle("isback",flipped); f.scrollTop=0;
    $("lCard").style.setProperty("--sc",flipped?backColor(c):"var(--accent)");
    const sb=$("lStarC"), on=lstars.has(c.id); sb.classList.toggle("on",on); sb.setAttribute("aria-pressed",on); }
  function starBtn(){ const n=starredIn(CARDS); $("lStarF").innerHTML=n?`⭐ ดาว <b>${n}</b>`:"⭐ ติดดาว"; $("lStarF").classList.toggle("on",onlyStar); }
  function toggleStar(){ const L2=list(); if(!L2.length) return; const c=L2[idx];
    if(lstars.has(c.id)) lstars.delete(c.id); else lstars.add(c.id);
    store.set("fc3-lit-star",[...lstars]); toast(lstars.has(c.id)?"ติดดาวแล้ว ⭐":"เอาดาวออกแล้ว");
    if(onlyStar&&!lstars.has(c.id)) render(); else { paint(); starBtn(); } }
  function render(){
    const L2=list(), tot=L2.length, kn=known(L2), uns=L2.filter(c=>mark[c.id]==="u").length;
    $("lCount").textContent=tot?`${Math.min(idx+1,tot)} / ${tot} · จำได้ ${kn}`:"";
    $("lPk").style.width=tot?(kn/tot*100)+"%":"0"; $("lPu").style.width=tot?(uns/tot*100)+"%":"0";
    const deck=$("lDeck");
    starBtn();
    if(!tot){ deck.innerHTML=`<div class="lempty">${onlyStar&&!starredIn(CARDS)?"ยังไม่มีการ์ดที่ติดดาวในหมวดนี้<br><br>แตะ ☆ มุมขวาบนของการ์ดเพื่อเก็บใบที่อยากทวนบ่อย ๆ":onlyStar?"ไม่มีการ์ดติดดาวในตัวกรองนี้":onlyUnsure?"🎉 จำได้ครบทุกใบในชุดนี้แล้ว<br><br>ปิด “ยังไม่แม่น” เพื่อทบทวนทั้งหมด":"ไม่มีการ์ดในตัวกรองนี้"}</div>`; return; }
    if(idx>=tot) idx=tot-1;
    saveLitRes();
    if(!$("lCard")){
      deck.innerHTML=`<div class="lcard" id="lCard" tabindex="0" aria-label="การ์ด แตะเพื่อพลิก"><div class="lface" id="lFace"></div><button class="lstar" id="lStarC" aria-label="ติดดาว">${IC.star}</button></div>
        <div class="lctl"><button class="nav" data-l="prev" aria-label="ก่อนหน้า">‹</button><button class="un" data-l="u">ยังไม่แม่น</button><button class="ok" data-l="k">จำได้แล้ว ✓</button><button class="nav" data-l="next" aria-label="ถัดไป">›</button></div>`;
      const card=$("lCard");
      card.onclick=e=>{ if(e.target.closest(".lnote")) return; if(e.target.closest("#lStarC")){ toggleStar(); return; } if(flipped&&String(getSelection())) return; flip(); };
      deck.querySelector(".lctl").onclick=e=>{ const a=e.target.closest("[data-l]"); if(!a) return; const v=a.dataset.l;
        if(v==="prev") go(-1); else if(v==="next") go(1); else markIt(v); };
      let sx=null,sy=null;
      card.addEventListener("touchstart",e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
      card.addEventListener("touchend",e=>{ if(sx===null) return; const dx=e.changedTouches[0].clientX-sx, dy=e.changedTouches[0].clientY-sy;
        if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){ e.preventDefault(); go(dx<0?1:-1); } sx=null; });
    }
    paint();
  }
  function flip(){ if(turning||!$("lCard")) return; turning=true; const card=$("lCard"); card.classList.add("turn");
    setTimeout(()=>{ flipped=!flipped; paint(); card.classList.remove("turn"); turning=false; },140); }
  function go(d){ const n=list().length; if(!n) return; idx=(idx+d+n)%n; flipped=false; render(); }
  function markIt(v){ const L2=list(); if(!L2.length) return; const c=L2[idx];
    mark[c.id]=v; store.set("fc3-lit",mark); flipped=false;
    if(!(onlyUnsure&&v==="k")) idx=(idx+1)%L2.length;
    render();
    if(v==="k"&&!onlyUnsure&&(fStory!=="all"||D.kind==="terms")&&list().every(x=>mark[x.id]==="k")) toast(tr("litDone")); }

  /* ---------- toolbar ---------- */
  $("lShuffle").onclick=()=>{ for(let i=order.length-1;i>0;i--){ const j=Math.random()*(i+1)|0; [order[i],order[j]]=[order[j],order[i]]; } idx=0; flipped=false; render(); saveLitRes(true); toast("สลับการ์ดแล้ว 🔀"); };
  $("lStarF").onclick=()=>{ onlyStar=!onlyStar; idx=resumeIdx(); flipped=false; render(); };
  $("lRev").onclick=()=>{ rev=!rev; savePref(); $("lRev").classList.toggle("on",rev); flipped=false; render(); toast(rev?"โชว์คำอธิบาย → ทายคำ":"โชว์คำ → ทายคำอธิบาย"); };
  $("lUnsure").onclick=()=>{ onlyUnsure=!onlyUnsure; $("lUnsure").classList.toggle("on",onlyUnsure); idx=resumeIdx(); flipped=false; render(); };
  let rbT=null; const rb=$("lReset");
  rb.onclick=()=>{
    if(rb.dataset.confirm){ CARDS.forEach(c=>delete mark[c.id]); store.set("fc3-lit",mark); order=CARDS.map(c=>c.id); idx=0; flipped=false; saveLitRes(true); rb.textContent="↺ เริ่มใหม่"; delete rb.dataset.confirm; render(); toast("ล้างสถานะหมวดนี้แล้ว"); return; }
    rb.dataset.confirm="1"; rb.textContent="กดอีกครั้งเพื่อล้าง"; clearTimeout(rbT);
    rbT=setTimeout(()=>{ rb.textContent="↺ เริ่มใหม่"; delete rb.dataset.confirm; },2500); };

  /* ---------- สรุป (เรื่องเล่า) / รายการคำ (terms) ---------- */
  function renderSum(){
    if(D.summary){
      $("lIntro").hidden=!D.intro; $("lIntro").innerHTML=D.intro||"";
      const gi=k=>D.groups.findIndex(g=>g.k===k)+1;
      $("lSumList").innerHTML=D.summary.map(x=>`
        <details class="lstory" style="--sc:${D.color}">
          <summary><span class="lnum">${gi(x.g)}</span><span class="lst"><b>${x.t}</b><span>${x.sub}</span></span><span class="lchev">›</span></summary>
          <div class="lsbody">${x.h.map(([t,l])=>`<h4>${t}</h4>${D.ul?D.ul(l):"<ul>"+l.map(i=>"<li>"+i+"</li>").join("")+"</ul>"}`).join("")}
            <button class="lgo" data-s="${x.g}">ฝึกการ์ดหัวข้อนี้ (${CARDS.filter(c=>c.g===x.g).length} ใบ) →</button></div>
        </details>`).join("");
      return;
    }
    if(D.kind==="story"){
      $("lIntro").hidden=false; $("lIntro").innerHTML=D.intro||"";
      $("lSumList").innerHTML=D.stories.map(s=>`
        <details class="lstory" style="--sc:${s.c}">
          <summary><span class="lnum">${s.id}</span><span class="lst"><b>${s.t}</b><span>${s.sub}</span></span><span class="lchev">›</span></summary>
          <div class="lsbody"><h4>เรื่องย่อ</h4>${D.ul(s.plot)}<h4>ข้อคิด</h4>${D.ul(s.lesson)}<h4>ความเชื่อ / ภาพสะท้อนสังคม</h4>${D.ul(s.belief)}
            <button class="lgo" data-s="${s.id}">ฝึกการ์ดเรื่องนี้ →</button></div>
        </details>`).join("");
    } else {
      $("lIntro").hidden=!D.intro; $("lIntro").innerHTML=D.intro||"";
      const row=c=>`<div class="ltrow"><span class="ltn">${CARDS.indexOf(c)+1}</span><div class="ltx"><b>${c.q}</b><div>${c.a}</div></div>${lstars.has(c.id)?'<span class="lts">⭐</span>':""}</div>`;
      $("lSumList").innerHTML=`<div class="lterms" style="--sc:${D.color}">`+(D.groups
        ? D.groups.map(g=>`<h4 class="ltg">${esc(g.n)}</h4>`+CARDS.filter(c=>c.g===g.k).map(row).join("")).join("")
        : CARDS.map(row).join(""))+`</div>`;
    }
  }
  $("lSumList").onclick=e=>{ const b=e.target.closest(".lgo"); if(!b) return; fStory=D.kind==="story"?+b.dataset.s:b.dataset.s; fCat="all"; deck=null; savePref(); idx=resumeIdx(); flipped=false; setTab("cards"); };

  function setTab(t){ tab=t; setHash(`lit-${D.id}${t==="list"?"":"-"+t}`);
    $("lTabs").querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.tab===t));
    $("lList").hidden=t!=="list"; $("lCards").hidden=t!=="cards"; $("lSum").hidden=t!=="sum"; $("lQuiz").hidden=t!=="quiz"; $("liCta").hidden=t!=="list";
    $("litView").classList.toggle("lc",t==="cards"); $("lScroll").scrollTop=0;
    if(t==="cards"){ deckBar(); renderChips(); render(); } else if(t==="list") renderLL(); else if(t==="quiz") renderQuiz(); else renderSum(); }
  $("lTabs").onclick=e=>{ const b=e.target.closest("button"); if(!b) return; if(b.dataset.tab==="cards"&&deck){ deck=null; flipped=false; } if(b.dataset.tab==="cards"&&tab!=="cards") idx=resumeIdx(); setTab(b.dataset.tab); };

  /* ---------- 📋 ลิสต์รวม (แบบหน้ารวมคำศัพท์) ---------- */
  let LF={g:"all",star:false,stat:null,q:""};
  const stOfL=c=>mark[c.id]==="k"?"k":mark[c.id]==="u"?"l":"n";
  const plainT=h=>String(h).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
  const normL=s=>plainT(s).toLowerCase().replace(/[\s()（）・〜~]/g,"");
  const grpList=()=>D.groups?D.groups.map(g=>[g.k,esc(g.n)]):D.kind==="story"?[...D.stories.map(s=>[s.id,`${s.id}. ${esc(s.t)}`,s.c]),[0,"ภาพรวม/เปรียบเทียบ",ST[0].c]]:[];
  function llItems(){
    let a=CARDS;
    if(LF.g!=="all") a=a.filter(c=>String(grpOf(c))===String(LF.g));
    if(LF.star) a=a.filter(c=>lstars.has(c.id));
    if(LF.stat) a=a.filter(c=>stOfL(c)===LF.stat);
    if(LF.q){ const q=normL(LF.q); a=a.filter(c=>normL(c.q+" "+c.a).includes(q)); }
    return a;
  }
  function renderLL(){
    const scope=LF.g==="all"?CARDS:CARDS.filter(c=>String(grpOf(c))===String(LF.g)), cnt={n:0,l:0,k:0}; scope.forEach(c=>cnt[stOfL(c)]++);
    $("liStats").innerHTML=["n","l","k"].map(k=>`<button class="stat ${LF.stat===k?"on":""}" data-s="${k}">${ring(cnt[k],scope.length,LIT_ST[k].c)}
      <span class="lb"><strong>${LIT_ST[k].th}</strong>${cnt[k]} / ${scope.length}</span></button>`).join("");
    const nStar=starredIn(CARDS);
    $("liChips").innerHTML=`<button class="chip ${LF.star?"on":""}" data-star="1">★ ติดดาว<span class="n">${nStar}</span></button>`+
      `<button class="chip ${LF.g==="all"?"on":""}" data-g="all">ทั้งหมด<span class="n">${CARDS.length}</span></button>`+
      grpList().map(([k,l,col])=>`<button class="chip ${String(LF.g)===String(k)?"on":""}" data-g="${k}">${col?`<i class="ldot" style="background:${col}"></i>`:""}${l}<span class="n">${CARDS.filter(c=>String(grpOf(c))===String(k)).length}</span></button>`).join("");
    const a=llItems();
    $("liItems").innerHTML=a.length?a.map(c=>{ const st=stOfL(c), s=D.kind==="story"?ST[c.s]:null;
      return `<div class="item litem" data-id="${c.id}">${st!=="n"?`<span class="st ${st}"></span>`:""}
        <div class="irow"><div class="itxt">${s?`<div class="limeta"><i class="ldot" style="background:${s.c}"></i>${c.s?esc(s.t):"ภาพรวม"} · ${CATN[c.cat]}</div>`:""}<div class="liq">${c.q}</div></div>
          <div class="iact"><button class="ic star ${lstars.has(c.id)?"on":""}" aria-label="ติดดาว">${IC.star}</button></div></div>
        <div class="lia">${c.a}</div>${notes[c.id]?`<div class="lia lnl"><b>📝 โน้ตของฉัน</b><br>${esc(notes[c.id])}</div>`:""}</div>`; }).join(""):`<div class="nores">ไม่มีการ์ดที่ตรงกับตัวกรองนี้</div>`;
    const sb=$("liStudy"); sb.disabled=!a.length; $("liRestart").disabled=!a.length;
    const rp=a.length?liPeek(a):0;
    sb.innerHTML=rp>0?`ทบทวนต่อ <small>· ใบที่ ${rp+1} / ${a.length}</small>`:`ทบทวนชุดนี้ <small>· ${a.length} ใบ</small>`;
    $("liQclr").style.display=LF.q?"block":"none";
  }
  $("liStats").onclick=e=>{ const b=e.target.closest(".stat"); if(!b) return; LF.stat=LF.stat===b.dataset.s?null:b.dataset.s; renderLL(); };
  $("liChips").onclick=e=>{ const b=e.target.closest(".chip"); if(!b) return; if(b.dataset.star) LF.star=!LF.star; else { LF.g=b.dataset.g==="all"?"all":(D.kind==="story"?+b.dataset.g:b.dataset.g); LF.stat=null; } renderLL(); };
  $("liQ").oninput=e=>{ LF.q=e.target.value.trim(); renderLL(); };
  $("liQclr").onclick=()=>{ LF.q=""; $("liQ").value=""; renderLL(); };
  $("liItems").onclick=e=>{ const it=e.target.closest(".litem"); if(!it) return; const id=it.dataset.id, c=BYID[id]||BYID[+id];
    if(e.target.closest(".star")){ const b=e.target.closest(".star");
      if(lstars.has(c.id)){ lstars.delete(c.id); b.classList.remove("on"); } else { lstars.add(c.id); b.classList.add("on"); }
      store.set("fc3-lit-star",[...lstars]); if(LF.star) renderLL(); else $("liChips").querySelector("[data-star] .n").textContent=starredIn(CARDS); return; }
    it.classList.toggle("open"); };
  /* ตำแหน่งที่ค้างไว้ของชุดที่กรองในหน้าลิสต์ (ไม่เปลี่ยน state) */
  function liPeek(a){ const k=[deck,onlyUnsure,onlyStar,idx]; deck=new Set(a.map(c=>c.id)); onlyUnsure=false; onlyStar=false;
    const i=resumeIdx(); [deck,onlyUnsure,onlyStar,idx]=k; return i; }
  /* ↺ เริ่มใหม่: ล้างสถานะ จำได้/ไม่แน่ใจ ของการ์ดในชุดนี้ (ไม่แตะติดดาว) แล้วเริ่มจากใบแรก */
  $("liRestart").onclick=e=>confirmTap(e.currentTarget,"↺ เริ่มใหม่",()=>{ let a=llItems(); if(!a.length||!D) return;
    const n=a.length; a.forEach(c=>delete mark[c.id]); store.set("fc3-lit",mark);
    const all=litRes(), r=all[D.id]; if(r&&r.pos){ delete r.pos["deck:"+a.map(c=>c.id).join(",")]; }
    if(LF.stat){ LF.stat=null; a=llItems(); if(r&&r.pos) delete r.pos["deck:"+a.map(c=>c.id).join(",")]; }
    try{ localStorage.setItem("fc3-lit-resume",JSON.stringify(all)); }catch(e){}
    renderLL(); $("liStudy").onclick(); saveLitRes(false,true); toast(`ล้างสถานะ ${n} ใบ · เริ่มใหม่ ↺`); });
  $("liStudy").onclick=()=>{ const a=llItems(); if(!a.length) return; deck=new Set(a.map(c=>c.id)); deck.label=deckLabel(); idx=resumeIdx(); flipped=false; onlyUnsure=false; onlyStar=false; $("lUnsure").classList.remove("on"); setTab("cards"); };
  function deckLabel(){ const p=[]; if(LF.g!=="all") p.push((grpList().find(([k])=>String(k)===String(LF.g))||[,""])[1]); if(LF.star) p.push("★ ติดดาว"); if(LF.stat) p.push(LIT_ST[LF.stat].th); if(LF.q) p.push(`“${esc(LF.q)}”`); return p.join(" · ")||"ทั้งหมด"; }
  function deckBar(){ const b=$("lDeckBar"); b.hidden=!deck; $("lFilt").style.display=deck?"none":"";
    if(deck) b.innerHTML=`<span>📋 จากลิสต์รวม: <b>${deck.label}</b> · ${deck.size} ใบ</span><button id="lDeckX">✕ ใช้ตัวกรองปกติ</button>`; }
  $("lDeckBar").onclick=e=>{ if(!e.target.closest("#lDeckX")) return; deck=null; idx=resumeIdx(); flipped=false; deckBar(); renderChips(); render(); };
  /* ---------- 📝 ข้อสอบ 4 ตัวเลือก ----------
     สร้างจากการ์ดของหมวดอัตโนมัติ: โจทย์ = คำถามของการ์ด, ตัวเลือกถูก = คำตอบ (ส่วนก่อน " — "),
     ตัวลวง = คำตอบของการ์ดอื่นในหัวข้อเดียวกันที่ยาวใกล้เคียงกัน · ตอบผิด → การ์ดใบนั้นถูกตั้งเป็น "ยังไม่แม่น"
     คะแนนดีที่สุดเก็บใน fc3-lit-quiz = { setId: {best, last, n} } */
  const QZ={stage:"setup", g:"all", src:"all", n:10, items:[], i:0, picked:null, res:[]};
  const plainA=h=>String(h).replace(/<small>.*?<\/small>/g,"").replace(/<h3>(.*?)<\/h3>[\s\S]*/,"$1")
    .replace(/<div class=.note.>[\s\S]*?<\/div>/g,"")
    .replace(/<\/?(b|i|span|em|strong)(\s[^>]*)?>/g,"")                  // แท็กในบรรทัด → ไม่เว้นวรรค
    .replace(/<(li|br|div|p|h4|ol|ul)[^>]*>/g," · ").replace(/<[^>]+>/g," ")
    .replace(/[•]/g," · ").replace(/\s*·\s*(·\s*)+/g," · ")
    .replace(/^\s*·\s*/,"").replace(/\s*·\s*$/,"").replace(/\s+/g," ").trim();
  function choiceOf(c){
    if(c._qz) return c._qz.a;
    if(/<h3>/.test(c.a)) return plainA(c.a);                       // การ์ดทายชื่อเรื่อง (อุจิ) → ชื่อเรื่อง
    let t=plainA(c.a); const cut=t.indexOf(" — ");
    if(cut>2&&!t.slice(0,cut).includes(" · ")&&!/<(br|li)/.test(c.a)) t=t.slice(0,cut).trim();   // ตัดคำอธิบายเสริมหลัง — (เฉพาะคำตอบบรรทัดเดียว)
    return t;
  }
  /* หมวดที่เขียนข้อสอบเอง (quizItems) → แปลงเป็น "การ์ดโจทย์" ที่ผูกกับ id การ์ดจริง (ตอบผิด = การ์ดนั้นยังไม่แม่น) */
  const qAll=()=>{ if(!D.quizItems) return CARDS.filter(quizable);
    return D._qp||(D._qp=D.quizItems.map(x=>{ const c=BYID[x.id]; return {id:x.id, g:c.g, q:x.q, a:c.ex||c.a, _qz:x}; })); };
  const quizable=c=>{ const t=choiceOf(c); return t.length>3&&t.length<=170&&!(D.kind==="story"&&c.cat==="full"); };
  function qPool(){ let a=qAll();
    if(QZ.g!=="all") a=a.filter(c=>String(grpOf(c))===String(QZ.g));
    if(QZ.src==="star") a=a.filter(c=>lstars.has(c.id));
    if(QZ.src==="weak") a=a.filter(c=>mark[c.id]!=="k");
    return a; }
  const shuf=a=>{ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.random()*(i+1)|0; [a[i],a[j]]=[a[j],a[i]]; } return a; };
  function makeQ(c){
    if(c._qz) return {c, opts:shuf([c._qz.a,...c._qz.w]), right:c._qz.a};
    const right=choiceOf(c), rl=right.length, seen=new Set([right]);
    const near=(pool)=>shuf(pool).filter(x=>x.id!==c.id).map(x=>({t:choiceOf(x),x}))
      .filter(o=>o.t&&o.t.length<=170&&!seen.has(o.t)&&!o.t.includes(right)&&!right.includes(o.t))
      .map(o=>({...o,d:Math.abs(Math.log((o.t.length+4)/(rl+4)))+Math.random()*.35})).sort((a,b)=>a.d-b.d);
    const same=D.kind==="story"?CARDS.filter(x=>x.cat===c.cat):CARDS.filter(x=>x.g===c.g);
    const out=[];
    for(const pool of [same,CARDS]) for(const o of near(pool)){ if(out.length>=3) break; if(seen.has(o.t)) continue; seen.add(o.t); out.push(o.t); }
    return {c, opts:shuf([right,...out]), right};
  }
  function startQuiz(cards){ QZ.items=cards.map(makeQ); QZ.i=0; QZ.picked=null; QZ.res=[]; QZ.stage="q"; renderQuiz(); $("lScroll").scrollTop=0; }
  const qBest=()=>((store.get("fc3-lit-quiz",{})||{})[D.id])||null;
  function renderQuiz(){
    const el=$("lQuiz");
    if(QZ.stage==="setup"){
      const groups=D.groups?D.groups.map(g=>[g.k,esc(g.n)]):D.kind==="story"?[...D.stories.map(s=>[s.id,`${s.id}. ${esc(s.t)}`]),[0,"ภาพรวม/เปรียบเทียบ"]]:[];
      const pool=qPool(), b=qBest();
      const nOpts=[10,20,30].filter(n=>n<pool.length);
      if(QZ.n!=="all"&&!nOpts.includes(QZ.n)) QZ.n=nOpts[0]||"all";
      const cnt=g=>qAll().filter(c=>g==="all"||String(grpOf(c))===String(g)).length;
      el.innerHTML=`<div class="qzbox">
        <div class="qzh"><b>📝 ข้อสอบ 4 ตัวเลือก</b><span>สุ่มโจทย์จากการ์ดในหมวดนี้ · ตอบผิดจะถูกตั้งเป็น “ยังไม่แม่น” ให้อัตโนมัติ</span>
          ${b?`<span class="qzbest">🏆 ดีที่สุด ${b.best}% · ล่าสุด ${b.last}%</span>`:""}</div>
        ${groups.length?`<div class="llab">${D.kind==="story"?"เรื่อง":"หัวข้อ"}</div><div class="lchips qzg">
          <button class="lchip ${QZ.g==="all"?"on":""}" data-g="all">ทั้งหมด <small>${cnt("all")}</small></button>
          ${groups.map(([k,n])=>`<button class="lchip ${String(QZ.g)===String(k)?"on":""}" data-g="${k}">${n} <small>${cnt(k)}</small></button>`).join("")}</div>`:""}
        <div class="llab">ข้อจาก</div><div class="lchips qzs">
          ${[["all","ทุกการ์ด"],["weak","ที่ยังจำไม่ได้"],["star","⭐ ติดดาว"]].map(([k,n])=>`<button class="lchip ${QZ.src===k?"on":""}" data-s="${k}">${n}</button>`).join("")}</div>
        <div class="llab">จำนวนข้อ</div><div class="lchips qzn">
          ${nOpts.map(n=>`<button class="lchip ${QZ.n===n?"on":""}" data-n="${n}">${n} ข้อ</button>`).join("")}
          <button class="lchip ${QZ.n==="all"?"on":""}" data-n="all">ทั้งหมด ${pool.length} ข้อ</button></div>
        <button class="qzgo" id="qzGo" ${pool.length<1?"disabled":""}>${pool.length?`เริ่มทำข้อสอบ · ${QZ.n==="all"?pool.length:Math.min(QZ.n,pool.length)} ข้อ`:"ไม่มีการ์ดในตัวเลือกนี้"}</button></div>`;
      return;
    }
    if(QZ.stage==="q"){
      const q=QZ.items[QZ.i], ok=QZ.res.filter(r=>r.ok).length, P=QZ.picked, L="ABCD";
      const st=D.kind==="story"?ST[q.c.s]:null, tag=st?(q.c.s?`${q.c.s}. ${esc(st.t)}`:"ภาพรวม"):(q.c.g&&GN[q.c.g]?esc(GN[q.c.g]):"");
      el.innerHTML=`<div class="qztop"><span>ข้อ ${QZ.i+1} / ${QZ.items.length}</span><span>ถูก ${ok}</span><button class="qzx" id="qzQuit">✕ เลิกทำ</button></div>
        <div class="lprog"><i class="k" style="width:${QZ.i/QZ.items.length*100}%"></i></div>
        <div class="qzq">${P!==null&&tag?`<div class="qztag">${tag}</div>`:""}<div class="qzqt">${q.c.q}</div></div>
        <div class="qzopts">${q.opts.map((o,i)=>{ const cls=P===null?"":o===q.right?"ok":i===P?"no":"dim";
          return `<button class="qzo ${cls}" data-i="${i}" ${P!==null?"disabled":""}><span class="qzl">${L[i]}</span><span>${esc(o)}</span></button>`; }).join("")}</div>
        ${P!==null?`<div class="qzexp ${q.opts[P]===q.right?"ok":"no"}"><b>${q.opts[P]===q.right?tr("vOk"):"✗ ยังไม่ถูก — เฉลย"}</b><div class="lans">${q.c.a}</div></div>
          <button class="qzgo" id="qzNext">${QZ.i+1<QZ.items.length?"ข้อต่อไป →":"ดูผลคะแนน 🎉"}</button>`:""}`;
      return;
    }
    const ok=QZ.res.filter(r=>r.ok).length, n=QZ.res.length, pct=Math.round(ok/n*100), wrong=QZ.res.filter(r=>!r.ok);
    el.innerHTML=`<div class="qzdone"><div class="qzscore">${ok}<small>/${n}</small></div><div class="qzpct">${pct}%</div>
        <div class="qzmsg">${tr(ok===n?"ex100":ok>=n*.8?"ex80":ok>=n*.5?"ex50":"ex0")}</div>
        <div class="qzbtns">${wrong.length?`<button class="qzgo" id="qzRetry">ทำข้อที่ผิดอีกครั้ง · ${wrong.length} ข้อ</button><button class="qzsec" id="qzStudy">🃏 ทบทวนข้อที่ผิดด้วยแฟลชการ์ด</button>`:""}
          <button class="qzsec" id="qzNew">ทำชุดใหม่</button></div></div>
      ${wrong.length?`<div class="llab">ข้อที่ตอบผิด</div>`+wrong.map(r=>`<div class="ltrow qzw" style="--sc:#e5484d"><div class="ltx"><b>${r.c.q}</b><div class="qzyou">ตอบ: ${esc(r.pick)}</div><div>✓ ${esc(choiceOf(r.c))}</div></div></div>`).join(""):""}`;
  }
  function pickOpt(i){ if(QZ.stage!=="q"||QZ.picked!==null) return; const q=QZ.items[QZ.i]; QZ.picked=i;
    const ok=q.opts[i]===q.right; QZ.res.push({c:q.c,ok,pick:q.opts[i]});
    if(!ok){ mark[q.c.id]="u"; store.set("fc3-lit",mark); }
    renderQuiz(); const ex=document.querySelector(".qzexp"); if(ex) ex.scrollIntoView({behavior:"smooth",block:"nearest"}); }
  function nextQ(){ if(QZ.i+1<QZ.items.length){ QZ.i++; QZ.picked=null; renderQuiz(); $("lScroll").scrollTop=0; return; }
    const ok=QZ.res.filter(r=>r.ok).length, pct=Math.round(ok/QZ.res.length*100), all=store.get("fc3-lit-quiz",{})||{}, b=all[D.id]||{best:0};
    all[D.id]={best:Math.max(b.best||0,pct), last:pct, n:QZ.res.length}; store.set("fc3-lit-quiz",all);
    QZ.stage="done"; renderQuiz(); $("lScroll").scrollTop=0; if(ok===QZ.res.length&&typeof confetti==="function") confetti(1800); }
  $("lQuiz").onclick=e=>{ const t=e.target;
    const g=t.closest("[data-g]"); if(g&&QZ.stage==="setup"){ QZ.g=g.dataset.g==="all"?"all":(D.kind==="story"?+g.dataset.g:g.dataset.g); renderQuiz(); return; }
    const s=t.closest("[data-s]"); if(s&&QZ.stage==="setup"){ QZ.src=s.dataset.s; renderQuiz(); return; }
    const n=t.closest("[data-n]"); if(n&&QZ.stage==="setup"){ QZ.n=n.dataset.n==="all"?"all":+n.dataset.n; renderQuiz(); return; }
    if(t.closest("#qzGo")){ const p=shuf(qPool()); startQuiz(QZ.n==="all"?p:p.slice(0,QZ.n)); return; }
    const o=t.closest(".qzo"); if(o){ pickOpt(+o.dataset.i); return; }
    if(t.closest("#qzNext")){ nextQ(); return; }
    if(t.closest("#qzQuit")||t.closest("#qzNew")){ QZ.stage="setup"; renderQuiz(); return; }
    if(t.closest("#qzRetry")){ startQuiz(shuf(QZ.res.filter(r=>!r.ok).map(r=>r.c))); return; }
    if(t.closest("#qzStudy")){ const w=QZ.res.filter(r=>!r.ok).map(r=>r.c.id); deck=new Set(w); deck.label="ข้อที่ตอบผิดในข้อสอบ"; idx=resumeIdx(); flipped=false; onlyUnsure=false; onlyStar=false; $("lUnsure").classList.remove("on"); setTab("cards"); }
  };
  document.addEventListener("keydown",e=>{
    if(S.view!=="lit"||page!=="set"||tab!=="quiz"||QZ.stage!=="q"||/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if(/^[1-4]$/.test(e.key)) pickOpt(+e.key-1);
    else if(e.key.toLowerCase()>="a"&&e.key.toLowerCase()<="d"&&e.key.length===1) pickOpt(e.key.toLowerCase().charCodeAt(0)-97);
    else if(e.key==="Enter"&&QZ.picked!==null){ e.preventDefault(); nextQ(); }
  });

  $("lBack").onclick=()=>{ if(page==="set") showPick(); else goHome(); };

  document.addEventListener("keydown",e=>{
    if(S.view!=="lit"||page!=="set"||tab!=="cards"||/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if(e.key===" "||e.key==="Enter"){ e.preventDefault(); flip(); }
    else if(e.key==="s"||e.key==="S") toggleStar();
    else if(e.key==="ArrowRight") go(1); else if(e.key==="ArrowLeft") go(-1);
    else if(e.key==="1") markIt("u"); else if(e.key==="2") markIt("k");
  });

  return {
    // arg: {set, tab} จาก router · ไม่มี set = หน้าเลือกหมวด
    enter(arg){ arg=arg||{}; if(arg.set) openSet(arg.set,arg.tab); else showPick(); },
    reload(){ mark=store.get("fc3-lit",{})||{}; lstars=new Set(store.get("fc3-lit-star",[])||[]); notes=store.get("fc3-lit-note",{})||{};
      if(D){ const o=order.join(); applyOrder(); if(page==="set"&&tab==="cards"){ const L2=list(), r=litRes()[D.id], want=r&&r.pos&&r.pos[fkey()]; if(want!=null&&(!L2[idx]||L2[idx].id!==want||o!==order.join())){ idx=resumeIdx(); flipped=false; } } }
      if(S.view!=="lit") return; if(page==="pick") renderPick(); else if(tab==="cards") render(); else if(tab==="list") renderLL(); else if(tab==="quiz"){ if(QZ.stage==="setup") renderQuiz(); } else renderSum(); },
    progress:()=>{ const all=SETS.flatMap(s=>s.cards); return {known:known(all), total:all.length, sets:SETS.filter(s=>s.cards.length).length}; }
  };
})();
