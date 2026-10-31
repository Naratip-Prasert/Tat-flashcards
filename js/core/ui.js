/* เสียงอ่าน (TTS), ไอคอน, คอนเฟตตี, ข้อความให้กำลังใจ */
/* ---------- speech ---------- */
let jaVoice=null;
function pickVoice(){ try{ const v=speechSynthesis.getVoices(); jaVoice=v.find(x=>/ja[-_]JP/i.test(x.lang))||v.find(x=>/^ja/i.test(x.lang))||null; }catch(e){} }
try{ pickVoice(); speechSynthesis.onvoiceschanged=pickVoice; }catch(e){}
function speak(c, btn){
  try{
    const txt=(c.r||c.w).replace(/[〜~]/g,"").replace(/[{}]/g,"").replace(/（[他自]）/g,"").replace(/・/g,"、");
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(txt); u.lang="ja-JP"; u.rate=0.9; if(jaVoice) u.voice=jaVoice;
    if(btn){ btn.classList.add("speaking"); u.onend=u.onerror=()=>btn.classList.remove("speaking"); }
    speechSynthesis.speak(u);
  }catch(e){ toast("อุปกรณ์นี้เล่นเสียงไม่ได้"); }
}

/* ---------- icons ---------- */
const IC = {
  spk:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>`,
  star:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>`
};


/* ---------- confetti ---------- */
function confetti(ms){
  const cv=$("confetti"), x=cv.getContext("2d"), dpr=window.devicePixelRatio||1;
  cv.width=innerWidth*dpr; cv.height=innerHeight*dpr; x.scale(dpr,dpr);
  const cols=["#f0508c","#ff9ec4","#ffd1e3","#b16ee8","#ffc94d","#7fd6b0"];
  const P=Array.from({length:120},()=>({x:Math.random()*innerWidth,y:-20-Math.random()*innerHeight*.5,vx:(Math.random()-.5)*2.4,
    vy:2+Math.random()*3,r:Math.random()*6.28,vr:(Math.random()-.5)*.25,w:6+Math.random()*6,h:8+Math.random()*8,c:cols[Math.random()*cols.length|0]}));
  const t0=performance.now();
  (function frame(t){
    x.clearRect(0,0,innerWidth,innerHeight);
    const fade=Math.max(0,1-Math.max(0,t-t0-ms+700)/700);
    P.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.03;p.r+=p.vr;x.save();x.globalAlpha=fade;x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.w/2,-p.h/2,p.w,p.h*Math.cos(p.r*2));x.restore()});
    if(t-t0<ms) requestAnimationFrame(frame); else x.clearRect(0,0,innerWidth,innerHeight);
  })(t0);
}

/* ---------- little cheer-up message (was the clock) — changes every 3 minutes, tap for a new one ---------- */
const CHEERS_FAN=["がんばって！💪","สู้ ๆ งับ ✊","เก่งมากงับ ♡","ทีละนิดก็พอ 🌱","พักบ้างคับ ☕","อีกนิดเดียว! 🔥","ファイト！🌸","วันนี้ก็ดีที่สุด ✨",
  "จำได้แน่ ๆ 🧠","ภูมิใจในตัวเองไว้งับ ☺","一歩ずつ 👣","ใจดีกับตัวเองด้วย 💗","คนเก่งของเค้า 🥰","You got this! 🌟","すごい！😆","ดื่มน้ำด้วยนะ 💧",
  "ยืดเส้นหน่อย 🙆","ค่อย ๆ ไปนะ 🐢","ผิดได้ ไม่เป็นไร 🌈","ทุกคำมีค่า 📚","ยิ้มหน่อยน้างับ 😊","Keep going! 🚀","เหนื่อยก็พักนะ 🛌","วันนี้ทำดีมาก 👏",
  "จุ๊ฟ ๆ 😘","大丈夫だよ 🤍","ฝันให้ไกล 🎌","ไปญี่ปุ่นกัน! 🗾","เป็นกำลังใจให้งับ 💌","よくできました 💮","อีกคำนะ 🍡","ไม่ต้องรีบ 🍵",
  "เก่งขึ้นทุกวัน 📈","ลุยต่อเลย 🏃","Small steps 🐾","ฮึบ ๆ 🦾","คิดถึงแทตนะคับ 💭","ตั้งใจมากเลย 🥺","えらい！🐱","แทตกินขนมหน่อย 🍪",
  "เดี๋ยวก็จบ 🎓","สู้ไปด้วยกันงับ 🤝","なんとかなる 🌤️","รักษาสุขภาพด้วย 🍎","Proud of you ><","หายใจลึก ๆ 🌬️","แทตเจ๋งจาดอะ 😎","ปังมากเริดส์ 🎉",
  "おつかれさま 🌙","รักนะ 💕","น่ารักที่สุด 🐰","แทตทำได้! 🌟"];
const CHEERS_GEN=["がんばって！💪","สู้ ๆ ✊","เก่งมาก 👏","ทีละนิดก็พอ 🌱","พักบ้างนะ ☕","อีกนิดเดียว! 🔥","ファイト！🌟","วันนี้ก็ดีที่สุด ✨",
  "จำได้แน่ ๆ 🧠","ภูมิใจในตัวเองไว้ ☺","一歩ずつ 👣","ใจดีกับตัวเองด้วย 💙","You got this! 🌟","すごい！😆","ดื่มน้ำด้วยนะ 💧","ยืดเส้นหน่อย 🙆",
  "ค่อย ๆ ไปนะ 🐢","ผิดได้ ไม่เป็นไร 🌈","ทุกคำมีค่า 📚","ยิ้มหน่อย 😊","Keep going! 🚀","เหนื่อยก็พักนะ 🛌","วันนี้ทำดีมาก 👍","大丈夫だよ 🤍",
  "ฝันให้ไกล 🎌","ไปญี่ปุ่นกัน! 🗾","よくできました 💮","อีกคำนะ 🍡","ไม่ต้องรีบ 🍵","เก่งขึ้นทุกวัน 📈","ลุยต่อเลย 🏃","Small steps 🐾",
  "ฮึบ ๆ 🦾","ตั้งใจมากเลย 🔆","えらい！🐱","กินขนมหน่อย 🍪","เดี๋ยวก็จบ 🎓","なんとかなる 🌤️","รักษาสุขภาพด้วย 🍎","Nice work! 🙌",
  "หายใจลึก ๆ 🌬️","เจ๋งมาก 😎","ปังมาก 🎉","おつかれさま 🌙","ทำได้แน่นอน 🌟","สม่ำเสมอชนะทุกอย่าง 🏆","จำทีละคำก็พอ ✍️","継続は力なり 💪",
  "วันละนิดก็ถึง 🗻","เยี่ยมไปเลย ⭐","มาได้ไกลแล้วนะ 🛤️","ภาษาใหม่ โลกใหม่ 🌏"];
const CHEERS_ROLE={fan:CHEERS_FAN, general:CHEERS_GEN};
let cheerLast=-1;
function cheer(){
  const CHEERS=CHEERS_ROLE[ROLE.id]||CHEERS_GEN;
  let i; do{ i=Math.random()*CHEERS.length|0; }while(i===cheerLast&&CHEERS.length>1); cheerLast=i;
  const el=$("clockT"); el.classList.remove("pop"); void el.offsetWidth; el.textContent=CHEERS[i]; el.classList.add("pop");
}
cheer(); setInterval(cheer,3*60*1000);
$("clock").onclick=cheer;
