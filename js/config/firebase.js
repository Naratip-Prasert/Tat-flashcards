// ☁️ ตั้งค่า Firebase สำหรับระบบล็อกอิน + ซิงก์ข้ามเครื่อง
// วิธีทำดูใน README หัวข้อ "ตั้งค่าล็อกอิน / ซิงก์ข้ามเครื่อง"
// คัดลอก firebaseConfig จาก Firebase console (Project settings → Your apps → Web app) มาวางแทนค่าด้านล่าง
// ค่าพวกนี้เปิดเผยได้ (ไม่ใช่รหัสลับ) ความปลอดภัยมาจาก Firestore rules
// ถ้ายังเป็น null แอปจะทำงานแบบเดิม (เซฟในเครื่องอย่างเดียว)
window.TAT_FIREBASE = {
  apiKey: "AIzaSyBrgYBogj8F4LOMqRs4pomOvBIQTODc-5E",
  authDomain: "tat-card-a7b26.firebaseapp.com",
  projectId: "tat-card-a7b26",
  storageBucket: "tat-card-a7b26.firebasestorage.app",
  messagingSenderId: "81667561532",
  appId: "1:81667561532:web:a1ea25ff7ce1eaea310b39"
};
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
