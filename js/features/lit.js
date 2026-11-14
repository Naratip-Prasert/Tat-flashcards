/* 📜 Hist Jap Lit — หน้าเลือกหมวด → แฟลชการ์ด + สรุป/รายการคำ ของแต่ละหมวด
   ข้อมูลแต่ละหมวดอยู่ใน data/lit-*.js (window.LIT_SETS)
     kind:"story" = แบบเรื่องเล่า มีเรื่อง/หมวดย่อย + สรุปเรื่อง (อุจิ)
     kind:"terms" = แบบคำ → คำอธิบาย (ชุดจาก Quizlet)
   ลิงก์: #lit (เลือกหมวด) · #lit-<id> (การ์ด) · #lit-<id>-sum (สรุป/รายการคำ)
   สถานะ: fc3-lit = { cardId: "k"|"u" }, fc3-lit-star = [cardId]  ← ซิงก์ข้ามเครื่อง (id ไม่ซ้ำข้ามหมวด) */
const L=(()=>{
  const SETS=(window.LIT_SETS||[]).slice().sort((a,b)=>(a.order||9)-(b.order||9));
  const BY=Object.fromEntries(SETS.map(s=>[s.id,s]));
  let mark=store.get("fc3-lit",{})||{}, lstars=new Set(store.get("fc3-lit-star",[])||[]);
  let prefAll=store.get("fc3-lit-f",{})||{};
  if("s" in prefAll||"c" in prefAll) prefAll={uji:{s:prefAll.s,c:prefAll.c}};          // old single-set format
  const savePref=()=>{ prefAll[D.id]={s:fStory,c:fCat,r:rev}; store.set("fc3-lit-f",prefAll); };

  let D=null, CARDS=[], BYID={}, ST={}, CATN={};
  let fStory="all", fCat="all", rev=false, onlyUnsure=false, onlyStar=false, order=[], idx=0, flipped=false, turning=false, tab="cards", page="pick";

  const known=cs=>cs.filter(c=>mark[c.id]==="k").length;
  const starredIn=cs=>cs.filter(c=>lstars.has(c.id)).length;
  const list=()=>order.map(id=>BYID[id]).filter(c=>c&&(fStory==="all"||String(c.s)===String(fStory))&&(fCat==="all"||c.cat===fCat)&&(!onlyUnsure||mark[c.id]!=="k")&&(!onlyStar||lstars.has(c.id)));

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
    openSet(b.dataset.set,"cards"); };

  function showPick(){
    page="pick"; setHash("lit");
    $("litView").classList.remove("lc"); $("lPick").hidden=false; $("lSet").hidden=true;
    $("lTitle").textContent="Hist Jap Lit 📜"; $("lSub").textContent="วรรณคดีญี่ปุ่น · เลือกหมวด";
    renderPick(); $("lScroll").scrollTop=0;
  }

  /* ---------- เปิดหมวด ---------- */
  function useSet(id){
    D=BY[id]; CARDS=D.cards; BYID=Object.fromEntries(CARDS.map(c=>[c.id,c]));
    ST=D.stories?Object.fromEntries(D.stories.map(s=>[s.id,s])):{}; ST[0]={id:0,t:"ภาพรวม",c:"#5a4a5f"};
    CATN=D.cats?Object.fromEntries(D.cats.map(c=>[c.k,c.n])):{};
    const p=prefAll[id]||{};
    fStory=D.stories?(p.s??"all"):"all"; fCat=D.cats?(p.c||D.cats[0].k):"all"; rev=!!p.r;
    order=CARDS.map(c=>c.id); idx=0; flipped=false; onlyUnsure=false; onlyStar=false;
    $("lUnsure").classList.remove("on"); $("lDeck").innerHTML="";
    $("lSumTab").textContent=D.sumLabel||"📖 รายการคำทั้งหมด";
    $("lFilt").hidden=D.kind!=="story"; $("lRev").hidden=D.kind!=="terms"; $("lRev").classList.toggle("on",rev);
  }
  function openSet(id,t){ if(!BY[id]||!BY[id].cards.length){ showPick(); return; }
    if(!D||D.id!==id) useSet(id);
    page="set"; $("lPick").hidden=true; $("lSet").hidden=false;
    $("lTitle").textContent=D.title; $("lSub").textContent=`${D.jp} · ${D.sub||""}`;
    setTab(t||"cards"); }

  /* ---------- chips (เฉพาะแบบเรื่องเล่า) ---------- */
  function chip(label,val,cur,color,fn){ const b=document.createElement("button"); b.className="lchip"+(String(val)===String(cur)?" on":"");
    b.innerHTML=(color?`<i style="background:${color}"></i>`:"")+label; b.onclick=fn; return b; }
  function renderChips(){
    const a=$("lStory"), b=$("lCat"); a.innerHTML=""; b.innerHTML="";
    if(D.kind!=="story") return;
    a.append(chip("ทั้งหมด","all",fStory,null,()=>pick("all",fCat)));
    D.stories.forEach(s=>a.append(chip(`${s.id}. ${esc(s.t)}`,s.id,fStory,s.c,()=>pick(s.id,fCat))));
    a.append(chip("ภาพรวม/เปรียบเทียบ",0,fStory,ST[0].c,()=>pick(0,fCat)));
    b.append(chip("ทุกหมวด","all",fCat,null,()=>pick(fStory,"all")));
    D.cats.forEach(c=>b.append(chip(c.n,c.k,fCat,null,()=>pick(fStory,c.k))));
  }
  function pick(s,c){ fStory=s; fCat=c; savePref(); idx=0; flipped=false; renderChips(); render(); }

  /* ---------- การ์ด ---------- */
  function sides(c){
    const m=mark[c.id];
    const st=m==="k"?'<span class="ltag ok">✓ จำได้</span>':m==="u"?'<span class="ltag un">ยังไม่แม่น</span>':"";
    if(D.kind==="terms"){
      const F=rev?c.a:c.q, B=rev?c.q:c.a, meta=`<div class="lmeta"><span class="ltag">${rev?"คำอธิบาย → คำ":"คำ → คำอธิบาย"}</span>${st}</div>`;
      return { front:`${meta}<div class="lq lterm-q">${F}</div><div class="lhint">แตะเพื่อดูคำตอบ</div>`,
               back:`${meta}<div class="lans"><div class="lqq">${F.replace(/<[^>]+>/g,"")}</div><div class="lterm-a">${B}</div></div>` };
    }
    const s=ST[c.s];
    // ด้านหน้าไม่บอกชื่อเรื่อง (ไม่งั้นเหมือนเฉลย) — ชื่อเรื่องโชว์ตอนพลิกดูคำตอบ
    const metaF=`<div class="lmeta"><span class="ltag">${CATN[c.cat]}</span>${st}</div>`;
    const meta=`<div class="lmeta"><span class="ltag st">${c.s?c.s+". "+esc(s.t):"ภาพรวม"}</span><span class="ltag">${CATN[c.cat]}</span>${st}</div>`;
    const plain=c.q.replace(/<small>.*?<\/small>/,"").replace(/<[^>]+>/g,"");
    return { front:`${metaF}<div class="lq">${c.q}</div><div class="lhint">แตะเพื่อดูคำตอบ</div>`,
             back:`${meta}<div class="lans"><div class="lqq">${esc(plain)}</div>${c.a}</div>` };
  }
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
    if(!$("lCard")){
      deck.innerHTML=`<div class="lcard" id="lCard" tabindex="0" aria-label="การ์ด แตะเพื่อพลิก"><div class="lface" id="lFace"></div><button class="lstar" id="lStarC" aria-label="ติดดาว">${IC.star}</button></div>
        <div class="lctl"><button class="nav" data-l="prev" aria-label="ก่อนหน้า">‹</button><button class="un" data-l="u">ยังไม่แม่น</button><button class="ok" data-l="k">จำได้แล้ว ✓</button><button class="nav" data-l="next" aria-label="ถัดไป">›</button></div>`;
      const card=$("lCard");
      card.onclick=e=>{ if(e.target.closest("#lStarC")){ toggleStar(); return; } if(flipped&&String(getSelection())) return; flip(); };
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
  $("lShuffle").onclick=()=>{ for(let i=order.length-1;i>0;i--){ const j=Math.random()*(i+1)|0; [order[i],order[j]]=[order[j],order[i]]; } idx=0; flipped=false; render(); toast("สลับการ์ดแล้ว 🔀"); };
  $("lStarF").onclick=()=>{ onlyStar=!onlyStar; idx=0; flipped=false; render(); };
  $("lRev").onclick=()=>{ rev=!rev; savePref(); $("lRev").classList.toggle("on",rev); flipped=false; render(); toast(rev?"โชว์คำอธิบาย → ทายคำ":"โชว์คำ → ทายคำอธิบาย"); };
  $("lUnsure").onclick=()=>{ onlyUnsure=!onlyUnsure; $("lUnsure").classList.toggle("on",onlyUnsure); idx=0; flipped=false; render(); };
  let rbT=null; const rb=$("lReset");
  rb.onclick=()=>{
    if(rb.dataset.confirm){ CARDS.forEach(c=>delete mark[c.id]); store.set("fc3-lit",mark); order=CARDS.map(c=>c.id); idx=0; flipped=false; rb.textContent="↺ เริ่มใหม่"; delete rb.dataset.confirm; render(); toast("ล้างสถานะหมวดนี้แล้ว"); return; }
    rb.dataset.confirm="1"; rb.textContent="กดอีกครั้งเพื่อล้าง"; clearTimeout(rbT);
    rbT=setTimeout(()=>{ rb.textContent="↺ เริ่มใหม่"; delete rb.dataset.confirm; },2500); };

  /* ---------- สรุป (เรื่องเล่า) / รายการคำ (terms) ---------- */
  function renderSum(){
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
      $("lSumList").innerHTML=`<div class="lterms" style="--sc:${D.color}">`+CARDS.map((c,i)=>`
        <div class="ltrow"><span class="ltn">${i+1}</span><div class="ltx"><b>${c.q}</b><div>${c.a}</div></div>${lstars.has(c.id)?'<span class="lts">⭐</span>':""}</div>`).join("")+`</div>`;
    }
  }
  $("lSumList").onclick=e=>{ const b=e.target.closest(".lgo"); if(!b) return; fStory=+b.dataset.s; fCat="all"; savePref(); idx=0; flipped=false; setTab("cards"); };

  function setTab(t){ tab=t; setHash(`lit-${D.id}${t==="sum"?"-sum":""}`);
    $("lTabs").querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.tab===t));
    $("lCards").hidden=t!=="cards"; $("lSum").hidden=t!=="sum";
    $("litView").classList.toggle("lc",t==="cards"); $("lScroll").scrollTop=0;
    if(t==="cards"){ renderChips(); render(); } else renderSum(); }
  $("lTabs").onclick=e=>{ const b=e.target.closest("button"); if(b) setTab(b.dataset.tab); };
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
    reload(){ mark=store.get("fc3-lit",{})||{}; lstars=new Set(store.get("fc3-lit-star",[])||[]);
      if(S.view!=="lit") return; if(page==="pick") renderPick(); else if(tab==="cards") render(); else renderSum(); },
    progress:()=>{ const all=SETS.flatMap(s=>s.cards); return {known:known(all), total:all.length, sets:SETS.filter(s=>s.cards.length).length}; }
  };
})();
