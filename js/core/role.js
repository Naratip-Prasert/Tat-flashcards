/* โรล: fan (แฟน — ธีมชมพู คำหวาน) / general (คนทั่วไป — ธีมฟ้า คำชมกลาง ๆ)
   ตัดสินจากชื่อผู้ใช้ที่ล็อกอิน เทียบกับ js/config/roles.js · ยังไม่ล็อกอิน = general
   จำโรลล่าสุดไว้ใน fc3-role เพื่อให้เปิดแอปมาแล้วได้ธีมถูกทันที (ไม่ต้องรอ Firebase) */
const TXT={
  fan:{
    homeSub:"ท่องศัพท์ญี่ปุ่นกันงับแทต♥ がんばって！", hVocab:"คำศัพท์อิอิ", hWrite:"เขียนประโยคอิอิ", wTitle:"เขียนประโยคอิอิ ✍️", defBg:"sakura",
    homeVocab:"แฟลชการ์ดคำศัพท์ จะช่วยให้แทตเรียนคำศัพท์ได้สนุกขึ้นงับบบ",
    homeWrite:"สุ่มประโยคไทยสั้น ๆ → เขียนเป็นภาษาญี่ปุ่น → ให้แทตลองพูดตามงับอิอิ",
    profSub:"โปสการ์ดจากแทต", namePh:"เช่น แทต", defName:"แทต",
    celeMsg:"เก่งมากงับที่รัก ♥♥♥", pcGreet:"Tat Card ♡",
    vOk:"✓ ถูกต้อง! เก่งมากงับที่รัก♥", vNear:"〜 เกือบถูกแล้ว อีกนิสสเดียวงับ", vNo:"✗ ไม่ต้องรีบๆงับ ค่อยๆทำ จุ๊ฟๆ", vGive:"👀 เฉลยอยู่นี่งับ",
    ex100:"เพอร์เฟกต์!! เก่งที่สุดเลยงับ 🥇", ex80:"เก่งมากงับ ใกล้เต็มแล้ว 🎉", ex50:"ดีมากเลย ทบทวนข้อที่ผิดอีกนิดนะ 💪", ex0:"ไม่เป็นไรงับ ลองอีกรอบ เดี๋ยวก็ได้ 🌱",
    pickOne:"เลือกอย่างน้อย 1 หมวดนะงับ", welcomeNew:"สมัครเรียบร้อย ยินดีต้อนรับงับ 🎉", welcomeBack:"ยินดีต้อนรับกลับมา {u} ♡"
  },
  general:{
    homeSub:"ท่องศัพท์ญี่ปุ่นทีละนิด がんばって！", hVocab:"คำศัพท์", hWrite:"เขียนประโยค", wTitle:"เขียนประโยค ✍️", defBg:"fuji",
    homeVocab:"แฟลชการ์ดคำศัพท์ ทวนคำ ฟังเสียง ติดดาวคำที่ยังไม่แม่น",
    homeWrite:"สุ่มประโยคไทยสั้น ๆ → เขียนเป็นภาษาญี่ปุ่น → ลองพูดตาม",
    profSub:"โปสการ์ดของคุณ", namePh:"ชื่อที่จะแสดง", defName:"ผู้เรียน",
    celeMsg:"ยอดเยี่ยมมาก ทำได้ครบแล้ว 👏", pcGreet:"Tat Card",
    vOk:"✓ ถูกต้อง! เยี่ยมมาก", vNear:"〜 เกือบถูกแล้ว อีกนิดเดียว", vNo:"✗ ยังไม่ถูก ลองดูเฉลยแล้วลองใหม่นะ", vGive:"👀 เฉลยอยู่ตรงนี้",
    ex100:"เต็ม! เยี่ยมมาก 🥇", ex80:"เก่งมาก ใกล้เต็มแล้ว 🎉", ex50:"ดีเลย ทบทวนข้อที่ผิดอีกนิดนะ 💪", ex0:"ไม่เป็นไร ลองอีกรอบ เดี๋ยวก็ได้ 🌱",
    pickOne:"เลือกอย่างน้อย 1 หมวดนะ", welcomeNew:"สมัครเรียบร้อย ยินดีต้อนรับ 🎉", welcomeBack:"ยินดีต้อนรับกลับมา {u}"
  }
};
/* ฟังก์ชันที่แต่ละโรลใช้ได้ — โรลทั่วไปเห็นแค่คำศัพท์ (ซ่อนเขียนประโยค / ทำแบบฝึก) */
const FEATURES={fan:{write:true}, general:{write:false}};
function can(f){ return !!(FEATURES[ROLE.id]||FEATURES.general)[f]; }
const LOGO={fan:"icons/apple-touch-icon.png", general:"icons/logo-general.svg"};
const THEME_COLOR={fan:"#fff4f8", general:"#f3f7fc"};
const ROLE={ id:(()=>{ try{ return localStorage.getItem("fc3-role")==="fan"?"fan":"general"; }catch(e){ return "general"; } })() };
function tr(k,vars){ let s=(TXT[ROLE.id]||TXT.general)[k]; if(s==null) s=TXT.general[k]||k; if(vars) for(const v in vars) s=s.replace("{"+v+"}",vars[v]); return s; }
function roleOf(username){ const fans=((window.TAT_ROLES&&TAT_ROLES.fan)||[]).map(x=>String(x).toLowerCase()); return username&&fans.includes(username.toLowerCase())?"fan":"general"; }
function applyRole(){
  document.documentElement.dataset.role=ROLE.id;
  const m=document.querySelector('meta[name="theme-color"]'); if(m) m.content=THEME_COLOR[ROLE.id];
  document.querySelectorAll("[data-t]").forEach(el=>{ el.textContent=tr(el.dataset.t); });
  document.querySelectorAll("[data-tph]").forEach(el=>{ el.placeholder=tr(el.dataset.tph); });
  document.querySelectorAll("img[data-logo]").forEach(el=>{ el.src=LOGO[ROLE.id]; });
}
window.TatRole={
  get:()=>ROLE.id, tr, can,
  fromUser(username){ setRole(roleOf(username)); }
};
function setRole(id){
  if(id===ROLE.id) return; ROLE.id=id;
  try{ localStorage.setItem("fc3-role",id); }catch(e){}
  applyRole();
  if(typeof cheer==="function") cheer();
  if(window.TatApp){ if(S.view==="write"&&!can("write")) goHome(); else TatApp.reload(); }
}
applyRole();
