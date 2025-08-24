# School Achievements (SvelteKit + Firebase)

เว็บแอปสำหรับบันทึกและแสดงผลผลงาน/ความสำเร็จ (เกียรติบัตร วุฒิบัตร ประกาศนียบัตร รางวัล การเข้าร่วมแข่งขัน/อบรม) ของผู้บริหาร ครู และนักเรียน โดยไม่ต้องล็อกอิน โครงสร้างใช้แนวคิด Domain-Driven Design (DDD).

## โครงสร้างสำคัญ (DDD)
- `src/lib/domain` นิยามโดเมนโมเดลและสัญญา (interfaces)
- `src/lib/application` use cases ที่เรียกผ่าน repository
- `src/lib/infrastructure` การเชื่อมต่อ Firebase (Firestore/Storage) และ repo implementation
- `src/lib/presentation` ส่วน UI และ validation
- `src/routes` เพจของ SvelteKit

## การตั้งค่า
1) คัดลอก `.env.example` เป็น `.env` แล้วกรอกค่าจาก Firebase Project settings (Web app)
```
PUBLIC_FIREBASE_API_KEY=...
PUBLIC_FIREBASE_AUTH_DOMAIN=...
PUBLIC_FIREBASE_PROJECT_ID=...
PUBLIC_FIREBASE_STORAGE_BUCKET=...
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
PUBLIC_FIREBASE_APP_ID=...
PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

2) ติดตั้ง dependencies และรัน
- Development: ใช้คำสั่ง `npm install` ตามด้วย `npm run dev` (พอร์ต 5173)
- Build: `npm run build` และ `npm run preview`

## กฎความปลอดภัย (สำหรับใช้งานแบบไม่ต้องล็อกอิน)
โปรดพิจารณาความเสี่ยง เพราะการเปิดเขียนสาธารณะอาจทำให้เกิดสแปมหรือเนื้อหาไม่เหมาะสม ควรใช้กฎด้านล่างร่วมกับการจำกัดขนาดไฟล์ ประเภทไฟล์ และการตรวจสอบข้อมูลฝั่ง client และตั้งค่าควบคุมเพิ่มเติมตามความเหมาะสมของโรงเรียน

ตัวอย่าง Firestore rules (ปรับเพิ่มได้):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /achievements/{id} {
      allow read: if true;
      allow create: if
        request.resource.data.keys().hasOnly([
          'title','description','issuer','date','ownerRole','ownerName','type','url','filePath','fileUrl','createdAt','updatedAt','createdAtTs'
        ]) &&
        request.resource.data.title is string &&
        request.resource.data.ownerRole in ['admin','teacher','student'] &&
        request.resource.data.ownerName is string &&
        request.resource.data.type in ['certificate','diploma','award','competition','training','other'] &&
        (request.resource.data.url == null || request.resource.data.url.matches('https?://.*')) &&
        request.resource.data.createdAt is int && request.resource.data.updatedAt is int;
      allow update, delete: if false; // ปิดการแก้ไข/ลบสำหรับผู้ใช้ทั่วไป
    }
  }
}
```

ตัวอย่าง Storage rules (จำกัดเฉพาะโฟลเดอร์ achievements และชนิดไฟล์/ขนาด):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /achievements/{allPaths=**} {
      allow read: if true;
      allow write: if
        request.resource.size < 10 * 1024 * 1024 && // <10MB
        request.resource.contentType.matches('image/.*') || request.resource.contentType == 'application/pdf';
    }
    // ที่เหลือปฏิเสธ
    match /{path=**} { allow read: if true; allow write: if false; }
  }
}
```

หมายเหตุ: ควรพิจารณาเพิ่ม reCAPTCHA / moderation หรือโหมดเฉพาะในเครือข่ายโรงเรียนเพื่อลดความเสี่ยงจากสาธารณะ

## เส้นทางใช้งาน
- `/` หน้าแรก
- `/submit` แบบฟอร์มบันทึกข้อมูล
- `/achievements` รายการทั้งหมด
- `/achievements/[id]` รายละเอียด

## License
MIT
