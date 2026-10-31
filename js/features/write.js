/* เขียนประโยค: 🎲 สุ่มแต่ง / 🎯 เลือกหมวด / 📝 ทำแบบฝึก + ไมค์พูดตาม */
/* ================= WRITE (sentence practice) ================= */
const W=(function(){
  const SEN=window.SENTENCES||[];
  const PUNCT=/[\s　。、．，,.!！?？・「」『』（）()〜~…‥:：;；"'“”‘’]/g;
  const N=s=>s.normalize("NFKC").replace(PUNCT,"").replace(/[ァ-ヶ]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-0x60));
  const reEsc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const PREFIX=/^(?:私|わたし|あなた)は/;
  function parse(p){ const segs=[]; let last=0; p.replace(/\{([^|}]+)\|([^}]+)\}/g,(m,k,r,i)=>{ if(i>last) segs.push({t:p.slice(last,i)}); segs.push({k,r}); last=i+m.length; return m; });
    if(last<p.length) segs.push({t:p.slice(last)}); return segs; }
  // pre-compile every accepted answer
  function compile(s){ s._v=s.ja.map(p=>{ const segs=parse(p);
    const re=new RegExp("^(?:(?:私|わたし|あなた)は)?"+segs.map(g=>g.k?`(?:${reEsc(N(g.k))}|${reEsc(N(g.r))})`:reEsc(N(g.t))).join("")+"$");
    return {segs,re,kanji:N(segs.map(g=>g.k||g.t).join("")),kana:N(segs.map(g=>g.r||g.t).join("")),say:segs.map(g=>g.r||g.t).join("")}; }); return s; }
  SEN.forEach(compile);

  /* ----- 🎲 sentence generator lives in js/engine/sentence-gen.js (N5–N1) ----- */
  const LV=["N5","N4","N3","N2","N1"];
  let level=store.get("fc3-wlv","N5"); if(!LV.includes(level)) level="N5";
  function lev(a,b){ a=[...a]; b=[...b]; const d=Array.from({length:b.length+1},(_,i)=>i);
    for(let i=1;i<=a.length;i++){ let prev=d[0]; d[0]=i; for(let j=1;j<=b.length;j++){ const t=d[j]; d[j]=Math.min(d[j]+1,d[j-1]+1,prev+(a[i-1]===b[j-1]?0:1)); prev=t; } } return d[b.length]; }
  function score(s,input){
    const n=N(input); if(!n) return {exact:false,ratio:0};
    if(s._v.some(v=>v.re.test(n))) return {exact:true,ratio:1};
    const m=n.replace(PREFIX,""); let best=0;
    s._v.forEach(v=>{
      const mix=N(v.segs.map(g=>g.k?(m.includes(N(g.k))?g.k:g.r):g.t).join(""));   // kanji where the user typed kanji, kana elsewhere
      [v.kanji,v.kana,mix].forEach(t=>{ const r=1-lev(m,t)/Math.max(m.length,t.length); if(r>best) best=r; }); });
    return {exact:false,ratio:best};
  }
  const ruby=segs=>segs.map(g=>g.k?`<ruby>${esc(g.k)}<rt>${esc(g.r)}</rt></ruby>`:esc(g.t)).join("");
  const plain=segs=>segs.map(g=>g.k||g.t).join("");
  // vocab categories that actually have sentences, in vocab order
  const KEY=s=>s.ch+"-"+s.sec;
  const CATS=[]; CH.forEach(c=>c.secs.forEach(s=>{ const k=c.id+"-"+s.id, n=SEN.filter(x=>KEY(x)===k).length; if(n) CATS.push({k,ch:c,sec:s,n}); }));
  const catOf=k=>CATS.find(c=>c.k===k);
  let sel=new Set(store.get("fc3-wsecs",null)||CATS.map(c=>c.k)); [...sel].forEach(k=>{ if(!catOf(k)) sel.delete(k); });
  const saveSel=()=>store.set("fc3-wsecs",[...sel]);

  let mode=store.get("fc3-wmode","set");
  let queue=[], cur=null, res=store.get("fc3-sent",{}), sess={n:0,ok:0}, answered=false;
  const save=()=>store.set("fc3-sent",res);
  const rank={ok:3,near:2,no:1};
  function setBest(id,v){ if(cur&&cur.gen) return; const r=res[id]||{}; if(!r.best||rank[v]>rank[r.best]) r.best=v; res[id]=r; save(); }

  function pool(){ return SEN.filter(s=>sel.has(KEY(s))); }
  function refill(){ const p=pool(); const notOk=p.filter(s=>!(res[s.id]&&res[s.id].best==="ok")), ok=p.filter(s=>res[s.id]&&res[s.id].best==="ok");
    shuffle(notOk); shuffle(ok); queue=[...notOk,...ok]; if(cur&&queue.length>1&&queue[0]===cur){ queue.push(queue.shift()); } }
  let panelDirty=false;
  function chips(){   // category picker (summary + panel)
    const p=pool(), all=sel.size===CATS.length;
    $("wPickSum").innerHTML = all ? `ทุกหมวด` : sel.size ? [...sel].map(k=>`<span class="jp">${esc(catOf(k).sec.jp)}</span>`).join(", ") : "ยังไม่ได้เลือก";
    $("wPickN").textContent=`${p.length} ประโยค`;
    let h=""; const groups=[...new Set(CATS.map(c=>c.ch.id))];
    groups.forEach(g=>{ const cs=CATS.filter(c=>c.ch.id===g), ch=cs[0].ch;
      h+=`<div class="wgrp"><div class="wgh"><span class="jp">${esc(ch.jp)}</span> ${esc(ch.th)}<button class="wgall" data-g="${g}">${cs.every(c=>sel.has(c.k))?"ไม่เลือกกลุ่มนี้":"เลือกทั้งกลุ่ม"}</button></div><div class="wgc">`+
        cs.map(c=>{ const ok=SEN.filter(s=>KEY(s)===c.k&&res[s.id]&&res[s.id].best==="ok").length;
          return `<button class="chip ${sel.has(c.k)?"on":""}" data-k="${c.k}"><span class="jp">${esc(c.sec.jp)}</span> ${esc(c.sec.th)}<span class="n">${ok}/${c.n}</span></button>`; }).join("")+`</div></div>`; });
    h+=`<div class="wpfoot"><button class="wbtn" id="wSelAll">${all?"ล้างที่เลือก":"เลือกทุกหมวด"}</button><button class="wbtn pri" id="wSelDone">เริ่มสุ่ม · ${p.length} ประโยค</button></div>`;
    $("wPanel").innerHTML=h;
    $("wPanel").querySelectorAll(".chip").forEach(b=>b.onclick=()=>{ const k=b.dataset.k; sel.has(k)?sel.delete(k):sel.add(k); saveSel(); panelDirty=true; chips(); });
    $("wPanel").querySelectorAll(".wgall").forEach(b=>b.onclick=()=>{ const cs=CATS.filter(c=>c.ch.id===b.dataset.g), on=cs.every(c=>sel.has(c.k)); cs.forEach(c=>on?sel.delete(c.k):sel.add(c.k)); saveSel(); panelDirty=true; chips(); });
    $("wSelAll").onclick=()=>{ if(sel.size===CATS.length) sel.clear(); else CATS.forEach(c=>sel.add(c.k)); saveSel(); panelDirty=true; chips(); };
    $("wSelDone").onclick=()=>closePanel();
    $("wSelDone").disabled=!p.length;
  }
  function openPanel(){ panelDirty=false; $("wPick").classList.add("open"); }
  function closePanel(){ if(!pool().length){ toast("เลือกอย่างน้อย 1 หมวดนะงับ"); return; } $("wPick").classList.remove("open"); if(panelDirty){ cur=null; queue=[]; next(); } }
  $("wPickBtn").onclick=()=>{ $("wPick").classList.contains("open")?closePanel():openPanel(); };
  function stat(){ $("wStat").innerHTML=`<span>ข้อที่ <b>${sess.n+(answered?0:1)}</b></span><span>ถูกรอบนี้ <b>${sess.ok}</b></span>`+(mode==="gen"?`<span>🎲 ระดับ <b>${level}</b> · แต่งใหม่ทุกข้อ</span>`:`<span>เหลือในชุด <b>${queue.length}</b></span>`); }
  function setMode(m){ mode=m; store.set("fc3-wmode",m);
    document.querySelectorAll("#wMode button").forEach(b=>b.classList.toggle("on",b.dataset.m===m));
    vis(); lvChips(); }
  function vis(){
    $("wPick").style.display=mode==="set"?"":"none";
    $("wLv").style.display=(mode==="gen"||(mode==="ex"&&ex.stage==="setup"))?"":"none";
    $("wEx").style.display=mode==="ex"?"":"none";
    $("wQ").style.display=(mode!=="ex"||ex.stage==="q")?"":"none";
    $("wStat").style.display=mode==="ex"?"none":"";
  }
  function lvChips(){
    const D={N5:"พื้นฐาน",N4:"ต้น",N3:"กลาง",N2:"กลาง-สูง",N1:"สูง"};
    $("wLv").innerHTML=LV.map(l=>`<button class="${l===level?"on":""}" data-l="${l}"><b>${l}</b><small>${D[l]}</small></button>`).join("");
    $("wLv").querySelectorAll("button").forEach(b=>b.onclick=()=>{ if(level===b.dataset.l) return; level=b.dataset.l; store.set("fc3-wlv",level); lvChips(); if(mode==="ex") exRender(); else next(); });
  }
  document.querySelectorAll("#wMode button").forEach(b=>b.onclick=()=>{ if(mode===b.dataset.m) { if(mode==="gen") next(); return; }
    stopMic(); setMode(b.dataset.m); $("wPick").classList.remove("open");
    if(mode==="ex"){ if(ex.stage==="q"&&cur&&cur.ex) exLoad(); else exRender(); return; }
    cur=null; queue=[]; next(); });
  function resetQ(){
    $("wTh").textContent=cur.th;
    $("wHint").textContent=cur.hint||"ไม่มีคำใบ้สำหรับข้อนี้"; $("wHint").classList.remove("on"); $("wHintBtn").style.display="";
    $("wAns").value=""; $("wAns").disabled=false;
    $("wCheck").textContent="ตรวจคำตอบ"; $("wBtns").style.display="";
    $("wRes").classList.remove("on"); $("wHeard").classList.remove("on");
    $("wMicSt").textContent=SR?"แตะเพื่อเริ่มพูด":"เครื่องนี้ไม่รองรับการฟังเสียงพูด — กด 🔊 แล้วพูดตามได้เลย";
    $("wMic").style.display=SR?"":"none";
    $("wNext").textContent=(mode==="ex"&&ex.i===ex.qs.length-1)?"ดูสรุปผล 🎉":"ข้อต่อไป →";
    $("wBody").parentElement.scrollTop=0;
  }

  /* ----- 📝 ทำแบบฝึก: level → random topic + 10 words → 10 sentences → summary ----- */
  const EXB=window.EX_BANK||{};
  const ex={stage:"setup",lv:"N5",topic:null,words:[],qs:[],i:0,res:[]};
  const rubyW=s=>ruby(parse(s));
  const wLabel=w=>w.w||w.j||w.d;
  const RK={ok:3,near:2,no:1,give:0};
  function exRender(){
    vis(); const box=$("wEx"), D={N5:"พื้นฐาน",N4:"ต้น",N3:"กลาง",N2:"กลาง-สูง",N1:"สูง"};
    if(ex.stage==="setup"){
      const tps=EXB[level]||[], nW=tps.reduce((a,t)=>a+t.words.length,0);
      box.innerHTML=`<div class="exbox"><h3>📝 ทำแบบฝึก <span class="exbadge">${level}</span><span style="font-size:13px;color:var(--muted);font-weight:500">${D[level]}</span></h3>
        <p>1) เลือกเลเวลด้านบน → 2) สุ่มหมวด + คำศัพท์ 10 คำมาให้อ่านก่อน → 3) แต่งประโยคจากคำเหล่านั้น 10 ข้อ แล้วดูสรุปคะแนน</p>
        <p>เลเวลนี้มี ${tps.length} หมวด · ${nW} คำ: ${tps.map(t=>esc(t.th)).join(" · ")}</p>
        <button class="exbig" id="exGo">🎲 สุ่มหมวด + คำศัพท์ 10 คำ</button></div>`;
      $("exGo").onclick=exStart; return;
    }
    if(ex.stage==="words"){
      box.innerHTML=`<div class="exbox"><h3><span class="exbadge">${ex.lv}</span>หมวด: ${esc(ex.topic.th)} <span class="jp" style="font-size:14px">${esc(ex.topic.jp)}</span></h3>
        <p>อ่านคำศัพท์ 10 คำนี้ให้คุ้นก่อน กด 🔊 ฟังเสียงได้ แล้วกดถัดไปเพื่อแต่งประโยค</p>
        <div class="exwords">${ex.words.map((w,i)=>`<div class="exw"><span class="no">${i+1}</span><div class="wx"><div class="wj">${rubyW(wLabel(w))}</div><div class="wt">${esc(w.t)}</div></div>
          <button class="ic spk" data-i="${i}" aria-label="ฟังเสียง">${IC.spk}</button></div>`).join("")}</div>
        <div class="exrow"><button class="wbtn" id="exRe">🔄 สุ่มชุดใหม่</button><button class="wbtn pri" id="exBegin">ถัดไป: แต่งประโยค ${ex.words.length} ข้อ →</button></div>
        <div style="text-align:center;margin-top:10px"><button class="selfok" id="exLv">← เปลี่ยนเลเวล</button></div></div>`;
      box.querySelectorAll(".spk").forEach(b=>b.onclick=()=>speak({r:window.SentenceGen.kanaOf(wLabel(ex.words[+b.dataset.i])),w:""},b));
      $("exRe").onclick=exStart; $("exBegin").onclick=exBegin; $("exLv").onclick=()=>{ex.stage="setup";exRender();}; return;
    }
    if(ex.stage==="q"){
      box.innerHTML=`<div class="expbar"><span><b>${ex.lv}</b> · ${esc(ex.topic.th)}</span><div class="dots">${ex.qs.map((q,i)=>`<i class="${i===ex.i?"cur":(ex.res[i]==="give"?"no":ex.res[i]||"")}"></i>`).join("")}</div><button id="exQuit">จบแบบฝึก</button></div>`;
      $("exQuit").onclick=()=>{ if(confirmQuit()) { ex.stage="done"; stopMic(); exRender(); } }; return;
    }
    if(ex.stage==="done"){
      const ok=ex.res.filter(r=>r==="ok").length, near=ex.res.filter(r=>r==="near").length, n=ex.qs.length;
      const msg=ok===n?"เพอร์เฟกต์!! เก่งที่สุดเลยงับ 🥇":ok>=n*0.8?"เก่งมากงับ ใกล้เต็มแล้ว 🎉":ok>=n*0.5?"ดีมากเลย ทบทวนข้อที่ผิดอีกนิดนะ 💪":"ไม่เป็นไรงับ ลองอีกรอบ เดี๋ยวก็ได้ 🌱";
      const ic={ok:"✅",near:"🟡",no:"❌",give:"👀"};
      box.innerHTML=`<div class="exbox"><div class="exscore"><div class="big">${ok}<small> / ${n}</small></div><p style="margin-top:6px;font-size:15px;color:var(--ink);font-weight:600">${msg}</p>
          <p>${ex.lv} · หมวด ${esc(ex.topic.th)}${near?` · เกือบถูก ${near} ข้อ`:""}</p></div>
        <div class="exwords">${ex.qs.map((q,i)=>`<div class="exw"><span class="st">${ic[ex.res[i]]||"⏭️"}</span><div class="wx"><div class="wj">${rubyW(wLabel(q.word))} <span class="wt">${esc(q.word.t)}</span></div>
          <div class="sent">${esc(q.th)} → <span class="jp" style="color:var(--ink)">${esc(plain(q._v[0].segs))}</span></div></div></div>`).join("")}</div>
        <div class="exrow"><button class="wbtn" id="exAgain">🔁 ทำชุดนี้อีกรอบ</button><button class="wbtn pri" id="exNew">🎲 สุ่มชุดใหม่</button></div>
        <div style="text-align:center;margin-top:10px"><button class="selfok" id="exLv2">← เปลี่ยนเลเวล</button></div></div>`;
      $("exAgain").onclick=exBegin; $("exNew").onclick=exStart; $("exLv2").onclick=()=>{ex.stage="setup";exRender();};
      if(ok>=n*0.8) confetti(2200);
      $("wBody").parentElement.scrollTop=0;
    }
  }
  let quitArm=0; function confirmQuit(){ const now=Date.now(); if(now-quitArm<3000) return true; quitArm=now; toast("แตะ \"จบแบบฝึก\" อีกครั้งเพื่อดูสรุปผล"); return false; }
  function exStart(){
    const tps=EXB[level]||[]; if(!tps.length) return;
    let tp; do{ tp=tps[Math.random()*tps.length|0]; }while(tps.length>1&&ex.topic&&tp===ex.topic&&ex.stage!=="setup"&&Math.random()<0.7);
    const ws=tp.words.slice(); shuffle(ws);
    Object.assign(ex,{stage:"words",lv:level,topic:tp,words:ws.slice(0,10)}); exRender(); $("wBody").parentElement.scrollTop=0;
  }
  function exBegin(){
    const used=new Set();
    ex.qs=ex.words.map(w=>compile(Object.assign(window.SentenceGen.exMake(w,ex.lv,used),{gen:true,ex:true})));
    ex.i=0; ex.res=ex.qs.map(()=>null); ex.stage="q"; exLoad();
  }
  function exLoad(){ cur=ex.qs[ex.i]; cur.id="ex:"+ex.i; answered=false; exRender();
    $("wTag").innerHTML=`<b>📝 ข้อ ${ex.i+1}/${ex.qs.length}</b>ใช้คำ <span class="jp">${esc(window.SentenceGen.kanjiOf(wLabel(cur.word)))}</span>`;
    resetQ(); }
  function exMark(kind){ if(mode!=="ex"||ex.stage!=="q") return; const p=ex.res[ex.i]; if(p==null||RK[kind]>RK[p]) ex.res[ex.i]=kind; exRender(); }
  function exNext(){ stopMic(); if(ex.i<ex.qs.length-1){ ex.i++; exLoad(); } else { ex.stage="done"; exRender(); } }

  function next(){
    stopMic();
    if(mode==="ex"){ if(ex.stage==="q") exNext(); else exRender(); return; }
    if(mode==="gen"){ cur=compile(Object.assign(window.SentenceGen.make(level),{gen:true})); cur.id="gen:"+cur.th; answered=false;
      $("wTag").innerHTML=`<b>🎲 ${level}</b><span class="jp">${esc(cur.gp)}</span>`; }
    else {
    if(!pool().length){ openPanel(); chips(); return; }
    if(!queue.length) refill();
    cur=queue.shift(); answered=false;
    const cat=catOf(KEY(cur)); $("wTag").innerHTML=cat?`<b class="jp">${esc(cat.sec.jp)}</b>${esc(cat.sec.th)}`:""; }
    resetQ(); chips(); stat();
  }
  function showResult(kind,input){
    const v=cur._v[0];
    const V={ok:["ok","✓ ถูกต้อง! เก่งมากงับที่รัก♥"],near:["near","〜 เกือบถูกแล้ว อีกนิสสเดียวงับ"],no:["no","✗ ไม่ต้องรีบๆงับ ค่อยๆทำ จุ๊ฟๆ"],give:["near","👀 เฉลยอยู่นี่งับ"]}[kind];
    $("wVerdict").className="verdict "+V[0]; $("wVerdict").textContent=V[1];
    $("wMineBox").style.display=input?"":"none"; $("wMine").textContent=input;
    $("wModel").innerHTML=`<span>${ruby(v.segs)}</span><button class="ic spk" id="wSay" aria-label="ฟังเสียง">${IC.spk}</button>`;
    $("wSay").onclick=e=>sayModel(e.currentTarget);
    const alts=cur._v.slice(1).map(x=>plain(x.segs));
    $("wAlt").innerHTML=alts.length?`ตอบแบบนี้ก็ถูก: ${alts.map(a=>`<span>${esc(a)}</span>`).join(" / ")}`:"";
    $("wSelfOk").style.display=(kind==="near"||kind==="no")?"":"none";
    $("wRes").classList.add("on");
    if(kind==="ok"){ $("wAns").disabled=true; $("wBtns").style.display="none"; } else { $("wCheck").textContent="ตรวจอีกครั้ง"; }
    setTimeout(()=>$("wRes").scrollIntoView({behavior:"smooth",block:"start"}),60);
  }
  function check(){
    const input=$("wAns").value.trim();
    if(!input){ toast("พิมพ์คำตอบก่อนนะ"); $("wAns").focus(); return; }
    const sc=score(cur,input), kind=sc.exact?"ok":sc.ratio>=0.75?"near":"no";
    if(!answered){ sess.n++; answered=true; }
    if(kind==="ok"){ sess.ok++; confetti(900); }
    setBest(cur.id,kind); exMark(kind); showResult(kind,input); stat(); chips();
    if(kind==="ok" && !cur.gen && pool().every(s=>res[s.id]&&res[s.id].best==="ok")) toast("🎉 เขียนถูกครบทุกประโยคในชุดนี้แล้ว!");
  }
  function give(){ if(!answered){ sess.n++; answered=true; } setBest(cur.id,"no"); exMark("give"); showResult("give",$("wAns").value.trim()); stat(); }
  function sayModel(btn){ speak({r:cur._v[0].say,w:""},btn); }

  /* ----- speech recognition ----- */
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  let rec=null, heard=[];
  function stopMic(){ if(rec){ try{rec.abort()}catch(e){} rec=null; } const m=$("wMic"); if(m) m.classList.remove("rec"); }
  function startMic(){
    if(!SR) return;
    if(rec){ try{rec.stop()}catch(e){} return; }
    try{speechSynthesis.cancel()}catch(e){}
    heard=[]; rec=new SR(); rec.lang="ja-JP"; rec.interimResults=true; rec.maxAlternatives=3; rec.continuous=false;
    $("wMic").classList.add("rec"); $("wMicSt").textContent="กำลังฟัง… พูดได้เลย (แตะอีกครั้งเพื่อหยุด)"; $("wHeard").classList.remove("on");
    rec.onresult=e=>{ let interim=""; heard=[];
      for(let i=0;i<e.results.length;i++){ const r=e.results[i]; if(r.isFinal){ for(let j=0;j<r.length;j++) heard.push(r[j].transcript); } else interim+=r[0].transcript; }
      if(interim) $("wMicSt").textContent="ได้ยิน: "+interim; };
    rec.onerror=e=>{ const msg={"not-allowed":"ยังไม่ได้อนุญาตให้ใช้ไมค์ — เปิดสิทธิ์ไมโครโฟนให้เว็บนี้ก่อนนะ","service-not-allowed":"ยังไม่ได้อนุญาตให้ใช้ไมค์ / การรู้จำเสียง","no-speech":"ไม่ได้ยินเสียงเลย ลองใหม่อีกครั้ง","audio-capture":"หาไมโครโฟนไม่เจอ","network":"ต้องต่อเน็ตเพื่อใช้การฟังเสียง"}[e.error];
      if(msg) $("wMicSt").textContent=msg; };
    rec.onend=()=>{ $("wMic").classList.remove("rec"); rec=null;
      if(!heard.length){ if(/กำลังฟัง|ได้ยิน:/.test($("wMicSt").textContent)) $("wMicSt").textContent="ไม่ได้ยินเสียงเลย ลองใหม่อีกครั้ง"; return; }
      let best={ratio:-1}, bestTx=heard[0];
      heard.forEach(t=>{ const s=score(cur,t); if(s.ratio>best.ratio){best=s;bestTx=t;} });
      const r=best.ratio, V= r>=0.95?["ok","🎉 ออกเสียงชัดมาก! สุดยอด"]: r>=0.7?["ok","👍 พูดได้ดีเลย"]: r>=0.45?["near","〜 ใกล้แล้ว ลองพูดช้า ๆ ชัด ๆ อีกที"]:["no","✗ ยังไม่ตรง ลองฟัง 🔊 แล้วพูดใหม่นะ"];
      $("wSpVerdict").className="verdict "+V[0]; $("wSpVerdict").textContent=V[1]; $("wHeardTx").textContent=bestTx; $("wHeard").classList.add("on");
      $("wMicSt").textContent="แตะเพื่อพูดอีกครั้ง";
      if(r>=0.7){ const x=res[cur.id]||{}; x.spoke=true; res[cur.id]=x; save(); if(r>=0.95) confetti(900); }
      setTimeout(()=>$("wHeard").scrollIntoView({behavior:"smooth",block:"nearest"}),60);
    };
    try{ rec.start(); }catch(e){ stopMic(); $("wMicSt").textContent="เริ่มฟังเสียงไม่ได้ ลองใหม่อีกครั้ง"; }
  }

  $("wReroll").onclick=()=>{ const b=$("wReroll"); b.classList.remove("spin"); void b.offsetWidth; b.classList.add("spin");
    if(mode==="ex"){ if(ex.stage==="q"){ const w=cur.word; ex.qs[ex.i]=compile(Object.assign(window.SentenceGen.exMake(w,ex.lv,null),{gen:true,ex:true})); exLoad(); } return; }
    if(mode!=="gen" && cur && !answered) queue.push(cur);   // skipped curated item goes back to the end
    next(); };
  $("wCheck").onclick=check; $("wGive").onclick=give; $("wNext").onclick=next; $("wMic").onclick=startMic;
  $("wSelfOk").onclick=()=>{ setBest(cur.id,"ok"); exMark("ok"); sess.ok++; showResult("ok",$("wAns").value.trim()); stat(); chips(); toast("โอเค นับว่าถูกนะ 👍"); };
  $("wHintBtn").onclick=()=>{ $("wHint").classList.toggle("on"); };
  $("wAns").addEventListener("keydown",e=>{ if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing&&e.keyCode!==229){ e.preventDefault(); check(); } });
  $("wBack").onclick=goHome;
  setMode(mode);
  return { reloadRes(){ res=store.get("fc3-sent",{})||{}; }, enter(){ if(mode==="ex"){ if(ex.stage!=="q") exRender(); else if(!cur) exLoad(); return; } if(!cur){ refill(); next(); } else { chips(); stat(); } }, stopMic, score, N, compile };
})();
