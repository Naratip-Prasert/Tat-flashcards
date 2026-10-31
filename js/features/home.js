/* หน้าแรก */
/* ================= HOME ================= */
function renderHome(){
  const k=ALL.filter(c=>stOf(c)==="k").length, l=ALL.filter(c=>stOf(c)==="l").length;
  $("hVocBar").style.width=(k/ALL.length*100)+"%";
  $("hVocTx").textContent=`จำได้แล้ว ${k} / ${ALL.length} คำ`;
  $("hVocTx2").textContent=l?`กำลังเรียน ${l}`:"";
  const SEN=window.SENTENCES||[], sr=store.get("fc3-sent",{}), ok=SEN.filter(s=>sr[s.id]&&sr[s.id].best==="ok").length;
  $("hWrBar").style.width=(SEN.length?ok/SEN.length*100:0)+"%";
  $("hWrTx").textContent=`เขียนถูกแล้ว ${ok} / ${SEN.length} ประโยค`;
}
$("goVocab").onclick=()=>{ setHash(S.ch); showView("list"); $("scroll").scrollTop=0; };
$("goWrite").onclick=()=>{ setHash("write"); showView("write"); };
$("homeBtn").onclick=goHome;
