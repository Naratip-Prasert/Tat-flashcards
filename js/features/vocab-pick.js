/* 📚 หน้าเลือกบทคำศัพท์ (#vocab) — แตะบทเพื่อเข้าลิสต์รวมของบทนั้น */
const CH_ICON={ch1:"🔬",ch2:"🩺",ch3:"🍳",ch4:"👗",ch5:"🤸",ch6:"💭"};
const CH_COLOR=["#e8638f","#4f8fd6","#e59a3a","#b16ee8","#3aa77a","#d9663f","#5a7bd8","#c2577f","#2b7f86"];
function renderVPick(){
  $("vpList").innerHTML=CH.map((c,i)=>{
    const items=ALL.filter(x=>x.ch===c.id), n=items.length, k=items.filter(x=>stOf(x)==="k").length,
          l=items.filter(x=>stOf(x)==="l").length, st=items.filter(x=>stars.has(x.id)).length, col=CH_COLOR[i%CH_COLOR.length];
    return `<button class="vpch" data-c="${c.id}" style="--sc:${col}">
      <span class="vpic">${CH_ICON[c.id]||"📘"}</span>
      <span class="vpt"><span class="vpno">บท ${c.no}</span><b><span class="jp">${c.jp}</span> ${esc(c.th)}</b>
        <span class="vpm">${n} คำ · จำได้ ${k}${l?` · กำลังเรียน ${l}`:""}${st?` · ⭐ ${st}`:""}</span>
        <span class="vpbar"><i class="k" style="width:${n?k/n*100:0}%"></i><i class="l" style="width:${n?l/n*100:0}%"></i></span>
        <span class="vpsec">${c.secs.map(s=>esc(s.th)).join(" · ")}</span></span>
      <span class="vpchev">›</span></button>`; }).join("");
}
$("vpList").onclick=e=>{ const b=e.target.closest(".vpch"); if(!b) return;
  if(b.dataset.c!==S.ch){ S.ch=b.dataset.c; store.set("fc3-ch",S.ch); S.stat=null; S.starOnly=false; S.q=""; $("q").value=""; }
  setHash(S.ch); showView("list"); $("scroll").scrollTop=0; };
$("vpBack").onclick=goHome;
