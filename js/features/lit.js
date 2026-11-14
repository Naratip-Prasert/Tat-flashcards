/* 📜 Hist Jap Lit — แฟลชการ์ด + สรุป "รวมเรื่องเล่าจากเมืองอุจิ" (ข้อมูลอยู่ใน data/lit-uji.js)
   สถานะการ์ด: fc3-lit = { cardId: "k" (จำได้) | "u" (ยังไม่แม่น) }  ← ซิงก์ข้ามเครื่องด้วย */
const L=(()=>{
  const D=window.LIT_UJI, CARDS=D.cards, ST=Object.fromEntries(D.stories.map(s=>[s.id,s]));
  ST[0]={id:0,t:"ภาพรวม",c:"#5a4a5f"};
  const CATN=Object.fromEntries(D.cats.map(c=>[c.k,c.n]));
  let mark=store.get("fc3-lit",{})||{}, lstars=new Set(store.get("fc3-lit-star",[])||[]);
  const pref=store.get("fc3-lit-f",{})||{};
  let fStory=pref.s??"all", fCat=pref.c||"full", onlyUnsure=false, onlyStar=false, order=CARDS.map(c=>c.id), idx=0, flipped=false, turning=false, tab="cards";

  const savePref=()=>store.set("fc3-lit-f",{s:fStory,c:fCat});
  const list=()=>order.map(id=>CARDS[id-1]).filter(c=>(fStory==="all"||String(c.s)===String(fStory))&&(fCat==="all"||c.cat===fCat)&&(!onlyUnsure||mark[c.id]!=="k")&&(!onlyStar||lstars.has(c.id)));
  const knownAll=()=>CARDS.filter(c=>mark[c.id]==="k").length;

  /* ---------- chips ---------- */
  function chip(label,val,cur,color,fn){ const b=document.createElement("button"); b.className="lchip"+(String(val)===String(cur)?" on":"");
    b.innerHTML=(color?`<i style="background:${color}"></i>`:"")+label; b.onclick=fn; return b; }
  function renderChips(){
    const a=$("lStory"), b=$("lCat"); a.innerHTML=""; b.innerHTML="";
    a.append(chip("ทั้งหมด","all",fStory,null,()=>pick("all",fCat)));
    D.stories.forEach(s=>a.append(chip(`${s.id}. ${esc(s.t)}`,s.id,fStory,s.c,()=>pick(s.id,fCat))));
    a.append(chip("ภาพรวม/เปรียบเทียบ",0,fStory,ST[0].c,()=>pick(0,fCat)));
    b.append(chip("ทุกหมวด","all",fCat,null,()=>pick(fStory,"all")));
    D.cats.forEach(c=>b.append(chip(c.n,c.k,fCat,null,()=>pick(fStory,c.k))));
  }
  function pick(s,c){ fStory=s; fCat=c; savePref(); idx=0; flipped=false; renderChips(); render(); }

  /* ---------- card ---------- */
  function sides(c){
    const s=ST[c.s], m=mark[c.id];
    const st=m==="k"?'<span class="ltag ok">✓ จำได้</span>':m==="u"?'<span class="ltag un">ยังไม่แม่น</span>':"";
    const meta=`<div class="lmeta"><span class="ltag st">${c.s?c.s+". "+esc(s.t):"ภาพรวม"}</span><span class="ltag">${CATN[c.cat]}</span>${st}</div>`;
    const plain=c.q.replace(/<small>.*?<\/small>/,"").replace(/<[^>]+>/g,"");
    return { front:`${meta}<div class="lq">${c.q}</div><div class="lhint">แตะเพื่อดูคำตอบ</div>`,
             back:`${meta}<div class="lans"><div class="lqq">${esc(plain)}</div>${c.a}</div>` };
  }
  function paint(){ const L2=list(); if(!L2.length) return; const c=L2[idx], f=$("lFace"), sd=sides(c);
    f.innerHTML=flipped?sd.back:sd.front; f.classList.toggle("isback",flipped); f.scrollTop=0;
    $("lCard").style.setProperty("--sc",ST[c.s].c);
    const sb=$("lStarC"), on=lstars.has(c.id); sb.classList.toggle("on",on); sb.setAttribute("aria-pressed",on); }
  function starBtn(){ $("lStarF").innerHTML=`⭐ ติดดาว${lstars.size?` <b>${lstars.size}</b>`:""}`; $("lStarF").classList.toggle("on",onlyStar); }
  function toggleStar(){ const L2=list(); if(!L2.length) return; const c=L2[idx];
    if(lstars.has(c.id)) lstars.delete(c.id); else lstars.add(c.id);
    store.set("fc3-lit-star",[...lstars]); toast(lstars.has(c.id)?"ติดดาวแล้ว ⭐":"เอาดาวออกแล้ว");
    if(onlyStar&&!lstars.has(c.id)) render(); else { paint(); starBtn(); } }
  function render(){
    const L2=list(), tot=L2.length, known=L2.filter(c=>mark[c.id]==="k").length, uns=L2.filter(c=>mark[c.id]==="u").length;
    $("lCount").textContent=tot?`${Math.min(idx+1,tot)} / ${tot} · จำได้ ${known}`:"";
    $("lPk").style.width=tot?(known/tot*100)+"%":"0"; $("lPu").style.width=tot?(uns/tot*100)+"%":"0";
    const deck=$("lDeck");
    starBtn();
    if(!tot){ deck.innerHTML=`<div class="lempty">${onlyStar&&!lstars.size?"ยังไม่มีการ์ดที่ติดดาว<br><br>แตะ ☆ มุมขวาบนของการ์ดเพื่อเก็บใบที่อยากทวนบ่อย ๆ":onlyStar?"ไม่มีการ์ดติดดาวในตัวกรองนี้":onlyUnsure?"🎉 จำได้ครบทุกใบในชุดนี้แล้ว<br><br>ปิด “ยังไม่แม่น” เพื่อทบทวนทั้งหมด":"ไม่มีการ์ดในตัวกรองนี้"}</div>`; return; }
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
  function flip(){ if(turning) return; turning=true; const card=$("lCard"); card.classList.add("turn");
    setTimeout(()=>{ flipped=!flipped; paint(); card.classList.remove("turn"); turning=false; },140); }
  function go(d){ const n=list().length; if(!n) return; idx=(idx+d+n)%n; flipped=false; render(); }
  function markIt(v){ const L2=list(); if(!L2.length) return; const c=L2[idx];
    mark[c.id]=v; store.set("fc3-lit",mark); flipped=false;
    if(!(onlyUnsure&&v==="k")) idx=(idx+1)%L2.length;
    render();
    if(v==="k"&&fStory!=="all"&&list().every(x=>mark[x.id]==="k")&&!onlyUnsure) toast(tr("litDone")); }

  /* ---------- toolbar ---------- */
  $("lShuffle").onclick=()=>{ for(let i=order.length-1;i>0;i--){ const j=Math.random()*(i+1)|0; [order[i],order[j]]=[order[j],order[i]]; } idx=0; flipped=false; render(); toast("สลับการ์ดแล้ว 🔀"); };
  $("lStarF").onclick=()=>{ onlyStar=!onlyStar; idx=0; flipped=false; render(); };
  $("lUnsure").onclick=()=>{ onlyUnsure=!onlyUnsure; $("lUnsure").classList.toggle("on",onlyUnsure); idx=0; flipped=false; if(!list().length) $("lDeck").innerHTML=""; render(); };
  let rbT=null; const rb=$("lReset");
  rb.onclick=()=>{
    if(rb.dataset.confirm){ mark={}; store.set("fc3-lit",mark); order=CARDS.map(c=>c.id); idx=0; flipped=false; rb.textContent="↺ เริ่มใหม่"; delete rb.dataset.confirm; render(); return; }
    rb.dataset.confirm="1"; rb.textContent="กดอีกครั้งเพื่อล้าง"; clearTimeout(rbT);
    rbT=setTimeout(()=>{ rb.textContent="↺ เริ่มใหม่"; delete rb.dataset.confirm; },2500); };

  /* ---------- summary ---------- */
  $("lIntro").innerHTML=D.intro;
  $("lSumList").innerHTML=D.stories.map(s=>`
    <details class="lstory" style="--sc:${s.c}">
      <summary><span class="lnum">${s.id}</span><span class="lst"><b>${s.t}</b><span>${s.sub}</span></span><span class="lchev">›</span></summary>
      <div class="lsbody"><h4>เรื่องย่อ</h4>${D.ul(s.plot)}<h4>ข้อคิด</h4>${D.ul(s.lesson)}<h4>ความเชื่อ / ภาพสะท้อนสังคม</h4>${D.ul(s.belief)}
        <button class="lgo" data-s="${s.id}">ฝึกการ์ดเรื่องนี้ →</button></div>
    </details>`).join("");
  $("lSumList").onclick=e=>{ const b=e.target.closest(".lgo"); if(!b) return; fStory=+b.dataset.s; fCat="all"; savePref(); idx=0; flipped=false; setTab("cards"); $("lScroll").scrollTop=0; };

  function setTab(t){ tab=t; setHash(t==="sum"?"lit-sum":"lit");
    $("lTabs").querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.tab===t));
    $("lCards").hidden=t!=="cards"; $("lSum").hidden=t!=="sum";
    $("litView").classList.toggle("lc",t==="cards"); $("lScroll").scrollTop=0;
    if(t==="cards"){ renderChips(); render(); } }
  $("lTabs").onclick=e=>{ const b=e.target.closest("button"); if(b) setTab(b.dataset.tab); };
  $("lBack").onclick=goHome;

  document.addEventListener("keydown",e=>{
    if(S.view!=="lit"||tab!=="cards"||/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if(e.key===" "||e.key==="Enter"){ e.preventDefault(); flip(); }
    else if(e.key==="s"||e.key==="S") toggleStar();
    else if(e.key==="ArrowRight") go(1); else if(e.key==="ArrowLeft") go(-1);
    else if(e.key==="1") markIt("u"); else if(e.key==="2") markIt("k");
  });

  return {
    enter(t){ setTab(t||tab); },
    reload(){ mark=store.get("fc3-lit",{})||{}; lstars=new Set(store.get("fc3-lit-star",[])||[]); if(S.view==="lit"&&tab==="cards") render(); },
    progress:()=>({known:knownAll(), total:CARDS.length})
  };
})();
