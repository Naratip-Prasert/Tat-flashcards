/* หน้าโปรไฟล์ (โปสการ์ด) + ย่อรูป */
/* ================= 💌 PROFILE (postcard) ================= */
if(!store.get("fc3-since",null)) store.set("fc3-since",Date.now());
const PRESETS=[
  {id:"sakura",n:"ซากุระ",bg:"linear-gradient(160deg,#ffc7dc 0%,#ffe6f0 55%,#fff7fb 100%)",deco:"🌸"},
  {id:"fuji",n:"ฟูจิ",bg:"linear-gradient(180deg,#9cc9ff 0%,#d7ebff 55%,#fff4f8 100%)",deco:"🗻"},
  {id:"sea",n:"ทะเล",bg:"linear-gradient(180deg,#7fd3e6 0%,#bdeaf2 50%,#fff3df 100%)",deco:"🏖️"},
  {id:"sunset",n:"ยามเย็น",bg:"linear-gradient(180deg,#ff9a9e 0%,#fecfef 60%,#fff1eb 100%)",deco:"🌇"},
  {id:"matcha",n:"มัทฉะ",bg:"linear-gradient(160deg,#cfe8c4 0%,#eef7e7 60%,#fffaf2 100%)",deco:"🍵"},
  {id:"night",n:"กลางคืน",bg:"linear-gradient(180deg,#3b3a6b 0%,#7b6fb0 60%,#f6c6dd 100%)",deco:"🎑"}
];
const STAMPS=["🗻","🌸","⛩️","🍣","🍡","🐱","🎌","💮","🍵","🐰"];
const TatProfile={
  get(){ return Object.assign({name:"",bio:"",stamp:"🗻",bg:{type:"preset",id:tr("defBg")},avatar:null,t:0},store.get("fc3-profile",{})||{}); },
  set(patch){ const p=Object.assign(TatProfile.get(),patch,{t:Date.now()}); try{localStorage.setItem("fc3-profile",JSON.stringify(p))}catch(e){ toast("รูปใหญ่เกินไป ลองรูปอื่นนะ"); return; }
    if(window.TatSync&&TatSync.pushProfile) TatSync.pushProfile(p); if(S.view==="profile") renderProfile(); if(window.TatSync) TatSync.refresh(); },
  display(){ const p=TatProfile.get(); return p.name||(window.TatSync&&TatSync.username&&TatSync.username())||tr("defName"); }
};
window.TatProfile=TatProfile;
function bgCss(p){ if(p.bg&&p.bg.type==="img"&&p.bg.data) return `background-image:url('${p.bg.data}')`; const pr=PRESETS.find(x=>x.id===(p.bg&&p.bg.id))||PRESETS[0]; return `background:${pr.bg}`; }
function renderProfile(){
  const p=TatProfile.get(), nm=TatProfile.display();
  const pr=p.bg&&p.bg.type==="img"?null:(PRESETS.find(x=>x.id===(p.bg&&p.bg.id))||PRESETS[0]);
  const k=ALL.filter(c=>stOf(c)==="k").length, sr=store.get("fc3-sent",{})||{}, SEN=window.SENTENCES||[];
  const okS=SEN.filter(s=>sr[s.id]&&sr[s.id].best==="ok").length;
  const since=new Date(store.get("fc3-since",Date.now())), today=new Date();
  const fmt=d=>d.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
  const pm=`${today.getDate()} ${today.toLocaleDateString("en-GB",{month:"short"}).toUpperCase()} ${String(today.getFullYear()).slice(2)}`;
  $("pc").innerHTML=`<div class="pc-in">
    <div class="pc-photo" style="${bgCss(p)}">${pr?`<span class="deco">${pr.deco}</span>`:""}
      <div class="pc-greet">Greetings from<br>${tr("pcGreet")}<small>日本語、がんばってね！</small></div></div>
    <div class="pc-stamp"><div>${esc(p.stamp||"🗻")}<small>JAPAN</small></div></div>
    <div class="pc-post"><b>TAT CARD</b>${pm}<br>BANGKOK</div>
    <div class="pc-body">
      <div class="pc-av" id="pcAv">${p.avatar?`<img src="${p.avatar}" alt="">`:esc([...nm][0]||"T")}</div>
      <div class="pc-name" id="pcName">${esc(nm)}<i>✎</i></div>
      <div class="pc-bio">${p.bio?esc(p.bio):`<span style="opacity:.55">แตะ ✎ เพื่อเขียนข้อความ</span>`}</div>
      <div class="pc-note">
        <div><span>📚 จำศัพท์ได้แล้ว</span><span><b>${k}</b> / ${ALL.length} คำ</span></div>
        <div><span>⭐ ติดดาวไว้</span><span><b>${stars.size}</b> คำ</span></div>
        ${can("write")?`<div><span>✍️ เขียนประโยคถูก</span><span><b>${okS}</b> / ${SEN.length} ข้อ</span></div>`:""}
        <div><span>🌱 เริ่มเรียนเมื่อ</span><span>${fmt(since)}</span></div>
      </div>
      <div class="pc-from"><span>From: <b style="color:var(--ink)">${esc(nm)}</b><br>To: ญี่ปุ่น 🇯🇵</span><span class="air">PAR AVION</span></div>
    </div></div>`;
  $("pcAv").onclick=()=>$("pAvIn").click();
  $("pcName").onclick=()=>{ $("pName").focus(); $("pName").scrollIntoView({behavior:"smooth",block:"center"}); };
  $("pPresets").innerHTML=PRESETS.map(x=>`<button style="background:${x.bg}" data-id="${x.id}" class="${pr&&pr.id===x.id?"on":""}" title="${x.n}">${x.deco}</button>`).join("")+
    (p.bg&&p.bg.type==="img"?`<button class="on" style="background-image:url('${p.bg.data}')" title="รูปของฉัน"></button>`:"");
  $("pPresets").querySelectorAll("button[data-id]").forEach(b=>b.onclick=()=>TatProfile.set({bg:{type:"preset",id:b.dataset.id}}));
  $("pStamps").innerHTML=STAMPS.map(s=>`<button class="${s===p.stamp?"on":""}">${s}</button>`).join("");
  $("pStamps").querySelectorAll("button").forEach(b=>b.onclick=()=>TatProfile.set({stamp:b.textContent}));
  if(document.activeElement!==$("pName")) $("pName").value=p.name||"";
  if(document.activeElement!==$("pBio")) $("pBio").value=p.bio||"";
  $("pAvDel").style.display=p.avatar?"":"none";
  const u=window.TatSync&&TatSync.username&&TatSync.username();
  $("pSyncNote").textContent=u?`☁️ โปรไฟล์ซิงก์กับบัญชี "${u}" — เปิดเครื่องไหนก็เหมือนกัน`:"☁️ เข้าสู่ระบบ (หน้าแรก) เพื่อให้โปรไฟล์ตรงกันทุกเครื่อง — ตอนนี้เซฟไว้ในเครื่องนี้";
}
// pick → crop (drag / pinch) → save small JPEG
$("pAvIn").onchange=async e=>{ const f=e.target.files[0]; e.target.value=""; if(!f) return;
  try{ const d=await cropImage(f,{w:240,h:240,round:true,q:.82,title:"ครอบรูปโปรไฟล์"}); if(d){ TatProfile.set({avatar:d}); toast("เปลี่ยนรูปโปรไฟล์แล้ว 📸"); } }catch(err){ toast("เปิดรูปนี้ไม่ได้ ลองรูปอื่นนะ"); } };
$("pBgIn").onchange=async e=>{ const f=e.target.files[0]; e.target.value=""; if(!f) return;
  try{ const d=await cropImage(f,{w:900,h:560,q:.72,title:"ครอบรูปพื้นหลัง"}); if(d){ TatProfile.set({bg:{type:"img",data:d}}); toast("เปลี่ยนพื้นหลังแล้ว 🖼️"); } }catch(err){ toast("เปิดรูปนี้ไม่ได้ ลองรูปอื่นนะ"); } };
$("pAvDel").onclick=()=>TatProfile.set({avatar:null});
const commitText=()=>{ const p=TatProfile.get(), n=$("pName").value.trim(), b=$("pBio").value.trim(); if(n!==p.name||b!==p.bio) TatProfile.set({name:n,bio:b}); };
["pName","pBio"].forEach(id=>{ $(id).addEventListener("change",commitText); $(id).addEventListener("keydown",e=>{ if(e.key==="Enter"&&!e.isComposing){ e.preventDefault(); $(id).blur(); } }); });
$("pBack").onclick=goHome;
