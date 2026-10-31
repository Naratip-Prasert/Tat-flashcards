// ☁️ ตั้งค่า Firebase สำหรับระบบล็อกอิน + ซิงก์ข้ามเครื่อง
// วิธีทำดูใน README หัวข้อ "ตั้งค่าล็อกอิน / ซิงก์ข้ามเครื่อง"
// คัดลอก firebaseConfig จาก Firebase console (Project settings → Your apps → Web app) มาวางแทนค่าด้านล่าง
// ค่าพวกนี้เปิดเผยได้ (ไม่ใช่รหัสลับ) ความปลอดภัยมาจาก Firestore rules
// ถ้ายังเป็น null แอปจะทำงานแบบเดิม (เซฟในเครื่องอย่างเดียว)
window.TAT_FIREBASE = null;
/* ตัวอย่าง:
window.TAT_FIREBASE = {
  apiKey: "AIza....",
  authDomain: "tat-card.firebaseapp.com",
  projectId: "tat-card",
  storageBucket: "tat-card.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};
*/
