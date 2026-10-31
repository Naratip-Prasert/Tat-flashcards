/* 🔍 ดูโปสการ์ดแบบเต็ม + 📤 แชร์เป็นรูป
   วาดโปสการ์ดลง canvas เอง (ไม่พึ่งไลบรารี) → PNG → แชร์ผ่าน navigator.share หรือบันทึกรูป */
const PC_W=360, PC_SCALE=3, PC_PAD=18;

function pcVars(){ const cs=getComputedStyle(document.documentElement), v=k=>cs.getPropertyValue(k).trim();
  return {accent:v("--accent"), soft:v("--accent-soft"), line2:v("--line2"), bg:v("--bg"), ink:v("--ink"), muted:v("--muted"), rgb:v("--accent-rgb"),
    air:document.documentElement.dataset.role==="general"?"#e05a5a":"#7aa7e8"}; }
function pcImg(src){ return new Promise(r=>{ if(!src) return r(null); const i=new Image(); i.onload=()=>r(i); i.onerror=()=>r(null); i.src=src; }); }
function rr(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function cssGrad(g,css,x,y,w,h){                         // "linear-gradient(160deg,#a 0%,#b 55%,…)" → canvas gradient
  const m=css.match(/linear-gradient\(\s*([\d.]+)deg\s*,(.*)\)/); if(!m) return css;
  const a=+m[1]*Math.PI/180, dx=Math.sin(a), dy=-Math.cos(a), L=Math.abs(w*dx)+Math.abs(h*dy), cx=x+w/2, cy=y+h/2;
  const gr=g.createLinearGradient(cx-dx*L/2,cy-dy*L/2,cx+dx*L/2,cy+dy*L/2);
  m[2].split(/,(?![^(]*\))/).forEach(s=>{ const p=s.trim().match(/^(.+?)\s+([\d.]+)%$/); if(p) gr.addColorStop(+p[2]/100,p[1]); });
  return gr;
}
function cover(g,im,x,y,w,h){ const s=Math.max(w/im.naturalWidth,h/im.naturalHeight), sw=w/s, sh=h/s;
  g.drawImage(im,(im.naturalWidth-sw)/2,(im.naturalHeight-sh)/2,sw,sh,x,y,w,h); }
function wrapText(g,text,maxW,maxLines){
  const seg=window.Intl&&Intl.Segmenter?[...new Intl.Segmenter("th",{granularity:"word"}).segment(text)].map(s=>s.segment):[...text];
  const lines=[]; let cur="";
  for(const s of seg){ if(g.measureText(cur+s).width>maxW&&cur){ lines.push(cur); cur=s.trimStart(); } else cur+=s; }
  if(cur) lines.push(cur);
  if(maxLines&&lines.length>maxLines){ lines.length=maxLines; lines[maxLines-1]=lines[maxLines-1].replace(/.$/u,"…"); }
  return lines;
}

async function renderPostcard(){
  const p=TatProfile.get(), nm=TatProfile.display(), C=pcVars();
  const pr=p.bg&&p.bg.type==="img"?null:(PRESETS.find(x=>x.id===(p.bg&&p.bg.id))||PRESETS[0]);
  const k=ALL.filter(c=>stOf(c)==="k").length, sr=store.get("fc3-sent",{})||{}, SEN=window.SENTENCES||[];
  const okS=SEN.filter(s=>sr[s.id]&&sr[s.id].best==="ok").length;
  const since=new Date(store.get("fc3-since",Date.now())), today=new Date();
  const fmt=d=>d.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
  try{ await Promise.race([Promise.all(["700 26px Mali","15px Mali","16px Yomogi","700 20px Mali"].map(f=>document.fonts.load(f))),new Promise(r=>setTimeout(r,2500))]); }catch(e){}
  const [bgIm,avIm]=await Promise.all([pcImg(p.bg&&p.bg.type==="img"?p.bg.data:null),pcImg(p.avatar)]);

  // measure the variable-height part first
  const meas=document.createElement("canvas").getContext("2d");
  const IW=PC_W-18, nameX=18+94, textW=IW-nameX-18;
  meas.font=`700 26px Mali, "Noto Sans Thai", sans-serif`; const nameL=wrapText(meas,nm,textW,2);
  meas.font=`16px Yomogi, Mali, "Noto Sans JP", sans-serif`; const bioL=p.bio?wrapText(meas,p.bio,textW,3):[];
  const nameH=Math.max(34,nameL.length*31), bioH=Math.max(22,bioL.length*22);
  const bodyTop=190, nameY=bodyTop+44-38, bioY=nameY+nameH+4, noteY=bioY+bioH+10+4, fromY=noteY+4*26+10;
  const IH=fromY+40+16, H=IH+18;

  const c=document.createElement("canvas"); c.width=(PC_W+PC_PAD*2)*PC_SCALE; c.height=(H+PC_PAD*2)*PC_SCALE;
  const g=c.getContext("2d"); g.scale(PC_SCALE,PC_SCALE);
  g.fillStyle=C.bg; g.fillRect(0,0,PC_W+PC_PAD*2,H+PC_PAD*2);
  g.translate(PC_PAD,PC_PAD);

  // airmail stripes
  g.save(); g.shadowColor=`rgba(${C.rgb},.22)`; g.shadowBlur=18; g.shadowOffsetY=8; rr(g,0,0,PC_W,H,20); g.fillStyle="#fff"; g.fill(); g.restore();
  g.save(); rr(g,0,0,PC_W,H,20); g.clip(); g.translate(PC_W/2,H/2); g.rotate(Math.PI/4);
  const span=PC_W+H; for(let x=-span;x<span;x+=48){ g.fillStyle=C.accent; g.fillRect(x,-span,14,span*2); g.fillStyle=C.air; g.fillRect(x+24,-span,14,span*2); }
  g.restore();

  // inner paper
  g.save(); g.translate(9,9); rr(g,0,0,IW,IH,13); g.clip();
  g.fillStyle="#fffaf2"; g.fillRect(0,0,IW,IH);
  g.fillStyle=`rgba(${C.rgb},.05)`; for(let y=0;y<IH;y+=26) g.fillRect(0,y,IW,1);

  // photo
  g.save(); g.beginPath(); g.rect(0,0,IW,190); g.clip();
  if(bgIm) cover(g,bgIm,0,0,IW,190); else { g.fillStyle=cssGrad(g,pr.bg,0,0,IW,190); g.fillRect(0,0,IW,190);
    g.globalAlpha=.9; g.font=`84px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign="right"; g.textBaseline="bottom"; g.fillText(pr.deco,IW-14,190+16); g.globalAlpha=1; }
  g.restore();
  g.save(); g.strokeStyle=C.line2; g.lineWidth=2; g.setLineDash([6,4]); g.beginPath(); g.moveTo(0,189); g.lineTo(IW,189); g.stroke(); g.restore();

  // greeting
  g.save(); g.translate(16,16); g.rotate(-4*Math.PI/180); g.textBaseline="top"; g.fillStyle="#fff";
  const greet=[["700 20px Mali, sans-serif","Greetings from",0],["700 20px Mali, sans-serif",tr("pcGreet"),22],[`14px Yomogi, "Noto Sans JP", sans-serif`,"日本語、がんばってね！",44]];
  greet.forEach(([f,t,y])=>{ g.font=f; g.save(); g.fillStyle=`rgba(${C.rgb},.55)`; g.fillText(t,0,y+2); g.restore();
    g.save(); g.shadowColor="rgba(0,0,0,.25)"; g.shadowBlur=12; g.shadowOffsetY=3; g.fillText(t,0,y); g.restore(); });
  g.restore();

  // postmark
  g.save(); g.translate(IW-58-37,58+37); g.rotate(-14*Math.PI/180);
  g.strokeStyle="rgba(90,70,110,.45)"; g.lineWidth=2; g.beginPath(); g.arc(0,0,35,0,Math.PI*2); g.stroke();
  g.fillStyle="rgba(90,70,110,.6)"; g.textAlign="center"; g.textBaseline="middle";
  const pm=`${today.getDate()} ${today.toLocaleDateString("en-GB",{month:"short"}).toUpperCase()} ${String(today.getFullYear()).slice(2)}`;
  g.font="700 11px system-ui, sans-serif"; g.fillText("TAT CARD",0,-12); g.font="700 8.5px system-ui, sans-serif"; g.fillText(pm,0,0); g.fillText("BANGKOK",0,12);
  for(let i=0;i<3;i++){ const gr=g.createLinearGradient(25,0,81,0); gr.addColorStop(0,"rgba(90,70,110,.45)"); gr.addColorStop(1,"rgba(90,70,110,0)"); g.fillStyle=gr; g.fillRect(25,-13+5+i*7,56,2); }
  g.restore();

  // stamp (perforated edge)
  const st=document.createElement("canvas"), SS=PC_SCALE; st.width=62*SS; st.height=74*SS; const s=st.getContext("2d"); s.scale(SS,SS);
  s.fillStyle="#fff"; s.fillRect(0,0,62,74); s.globalCompositeOperation="destination-out";
  for(let x=0;x<=62;x+=7){ s.beginPath(); s.arc(x,0,2.6,0,7); s.arc(x,74,2.6,0,7); s.fill(); }
  for(let y=0;y<=74;y+=7){ s.beginPath(); s.arc(0,y,2.6,0,7); s.arc(62,y,2.6,0,7); s.fill(); }
  s.globalCompositeOperation="source-over";
  const sg=cssGrad(s,`linear-gradient(160deg,${C.soft} 0%,${C.bg} 100%)`,5,5,52,64); s.fillStyle=sg; s.fillRect(5,5,52,64);
  s.strokeStyle=C.line2; s.lineWidth=1.5; s.strokeRect(5.75,5.75,50.5,62.5);
  s.textAlign="center"; s.textBaseline="middle"; s.font=`28px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; s.fillStyle="#000"; s.fillText(p.stamp||"🗻",31,32);
  s.font=`700 9px "Noto Sans JP", sans-serif`; s.fillStyle=C.accent; s.fillText("JAPAN",31,55);
  g.save(); g.translate(IW-12-31,12+37); g.rotate(5*Math.PI/180); g.shadowColor="rgba(0,0,0,.18)"; g.shadowBlur=4; g.shadowOffsetY=2; g.drawImage(st,-31,-37,62,74); g.restore();

  // avatar
  const ax=16+42, ay=bodyTop-46+42;
  g.save(); g.shadowColor="rgba(0,0,0,.12)"; g.shadowBlur=12; g.shadowOffsetY=4; g.beginPath(); g.arc(ax,ay,42,0,7); g.fillStyle="#fff"; g.fill(); g.restore();
  g.save(); g.beginPath(); g.arc(ax,ay,38,0,7); g.clip(); g.fillStyle=C.soft; g.fillRect(ax-38,ay-38,76,76);
  if(avIm) cover(g,avIm,ax-38,ay-38,76,76); else { g.fillStyle=C.accent; g.font=`700 36px "Noto Sans Thai", sans-serif`; g.textAlign="center"; g.textBaseline="middle"; g.fillText([...nm][0]||"T",ax,ay+2); }
  g.restore();

  // name + bio
  g.textBaseline="top"; g.textAlign="left";
  g.fillStyle=C.ink; g.font=`700 26px Mali, "Noto Sans Thai", sans-serif`; nameL.forEach((l,i)=>g.fillText(l,nameX,nameY+i*31+2));
  g.fillStyle="#7a5a6a"; g.font=`16px Yomogi, Mali, "Noto Sans JP", sans-serif`; bioL.forEach((l,i)=>g.fillText(l,nameX,bioY+i*22+2));

  // stats
  const rows=[["📚 จำศัพท์ได้แล้ว",[[k,1],[` / ${ALL.length} คำ`]]],["⭐ ติดดาวไว้",[[stars.size,1],[" คำ"]]],["✍️ เขียนประโยคถูก",[[okS,1],[` / ${SEN.length} ข้อ`]]],["🌱 เริ่มเรียนเมื่อ",[[fmt(since)]]]];
  g.textBaseline="middle";
  rows.forEach(([lab,val],i)=>{ const y=noteY+i*26+13;
    g.font="15px Mali, sans-serif"; g.fillStyle="#5a4250"; g.textAlign="left"; g.fillText(lab,18,y);
    let x=IW-18; g.textAlign="right";
    for(let j=val.length-1;j>=0;j--){ const [t,b]=val[j]; g.font=(b?"700 ":"")+"15px Mali, sans-serif"; g.fillStyle=b?C.accent:"#5a4250"; g.fillText(String(t),x,y); x-=g.measureText(String(t)).width; } });

  // from / to + PAR AVION
  g.textAlign="left"; g.textBaseline="top"; g.font="13px Mali, sans-serif"; g.fillStyle="#8a6a7a";
  g.fillText("From: ",18,fromY); const fw=g.measureText("From: ").width; g.font="700 13px Mali, sans-serif"; g.fillStyle=C.ink;
  g.fillText(wrapText(g,nm,IW-18-fw-110,1)[0]||"",18+fw,fromY);
  g.font="13px Mali, sans-serif"; g.fillStyle="#8a6a7a"; g.fillText("To: ญี่ปุ่น 🇯🇵",18,fromY+20);
  g.save(); g.translate(IW-18-40,fromY+30); g.rotate(-3*Math.PI/180); g.strokeStyle=C.air; g.lineWidth=1.5; rr(g,-40,-9,80,18,4); g.stroke();
  g.fillStyle=C.air; g.font="700 10px system-ui, sans-serif"; g.textAlign="center"; g.textBaseline="middle"; if("letterSpacing" in g) g.letterSpacing="1px"; g.fillText("PAR AVION",0,1); g.restore();

  g.restore();
  return await new Promise(r=>c.toBlob(r,"image/png"));
}

/* ---------- full-view overlay ---------- */
let pcFile=null, pcUrl=null;
const pcFull=document.createElement("div"); pcFull.className="pcfull"; pcFull.id="pcFull";
pcFull.innerHTML=`<div class="pcf-img"><div class="pcf-load">กำลังเตรียมโปสการ์ด…</div><img alt="โปสการ์ด" id="pcfImg"></div>
  <div class="pcf-bar"><button id="pcfClose">ปิด</button><button id="pcfSave">⬇️ บันทึกรูป</button><button class="pri" id="pcfShare">📤 แชร์</button></div>`;
document.body.appendChild(pcFull);
function pcName(){ return "tat-card-postcard.png"; }
async function openPostcard(autoShare){
  pcFull.classList.add("on","loading"); $("pcfImg").removeAttribute("src"); pcFile=null;
  try{
    const blob=await renderPostcard(); if(!blob) throw 0;
    if(pcUrl) URL.revokeObjectURL(pcUrl); pcUrl=URL.createObjectURL(blob);
    pcFile=new File([blob],pcName(),{type:"image/png"});
    $("pcfImg").src=pcUrl; pcFull.classList.remove("loading");
    if(autoShare&&navigator.userActivation&&navigator.userActivation.isActive) sharePostcard();
  }catch(e){ pcFull.classList.remove("on","loading"); toast("สร้างรูปโปสการ์ดไม่สำเร็จ ลองใหม่อีกครั้งนะ"); }
}
function savePostcard(){ if(!pcUrl) return; const a=document.createElement("a"); a.href=pcUrl; a.download=pcFile?pcFile.name:"tat-card.png"; document.body.appendChild(a); a.click(); a.remove(); toast("บันทึกรูปแล้ว ⬇️"); }
async function sharePostcard(){
  if(!pcFile) return;
  const data={files:[pcFile],title:"Tat Card",text:`โปสการ์ดจาก Tat Card 💌 ${location.origin}${location.pathname}`};
  if(navigator.canShare&&navigator.canShare({files:[pcFile]})){
    try{ await navigator.share(data); }catch(e){ if(e&&e.name!=="AbortError") savePostcard(); }
  } else savePostcard();
}
$("pcfClose").onclick=()=>pcFull.classList.remove("on");
$("pcfSave").onclick=savePostcard;
$("pcfShare").onclick=sharePostcard;
pcFull.addEventListener("click",e=>{ if(e.target===pcFull||e.target.classList.contains("pcf-img")) pcFull.classList.remove("on"); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&pcFull.classList.contains("on")) pcFull.classList.remove("on"); });
$("pFull").onclick=()=>openPostcard(false);
$("pShare").onclick=()=>openPostcard(true);
