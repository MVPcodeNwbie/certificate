# Firestore Rules Rationale

## 1. หลักการออกแบบ
1. เปิดอ่านสาธารณะ (read true) เฉพาะคอลเลคชันที่ต้องการแสดงผล
2. จำกัดการเขียนด้วย schema whitelist (keys().hasOnly([...]))
3. ป้องกันการแก้ `createdAt` ภายหลัง (immutableCreatedAt)
4. Projection (`searchMetadata`) ต้องมี doc แม่ก่อน ลด spam injection
5. Append-only logs (auditLogs, cspReports) ไม่มี update/delete

## 2. Achievement Schema Whitelist
| Field | Type | Req | Max / Constraint | เหตุผล |
|-------|------|-----|------------------|--------|
| title | string | ✓ | 1-150 | แสดงผลหลัก / search |
| normalizedTitle | string | ✓ | derived | ตรวจ duplicate |
| description | string | - | ≤2000 | รายละเอียด |
| issuer | string | - | ≤200 | หน่วยงาน |
| date | string | - | ISO | แสดงวันออก |
| ownerRole | enum | ✓ | admin/teacher/student | Facet |
| ownerName | string | ✓ | ≤120 | แสดง & facet |
| type | enum | ✓ | 6 types | Facet |
| url | string | - | ≤500 | อ้างอิงภายนอก |
| filePath | string | - | ≤400 | Internal reference |
| fileUrl | string | - | ≤800 | Display evidence |
| academicYear | int | - | 2500-2600 | Filter/analytics |
| createdAt | int | ✓ | epoch ms | Ordering |
| updatedAt | int | ✓ | epoch ms | Cache control |
| createdAtTs | timestamp/int | - | serverTimestamp | Auditing |
| evidence | list | - | size ≤20 | ไฟล์แนบ |
| actorHash | string | - | hashed | Abuse correlation |
| tags | list | - | size ≤30 | Semantic grouping (basic) |
| views | int | - | 0..1e9 | Engagement |
| likes | int | - | 0..1e9 | Engagement |
| orgLevel | enum | - | school..national | Analytics dimension |
| orgNames | list | - | size ≤5 | Drilldown |

## 3. Validation Functions
- `validAchievement()` กลาง: รวม whitelist + ง่ายต่อ audit
- `validSearchMetadataCreate/Update()` ลด field drift
- `immutableCreatedAt()` ลดการ rewrite retroactive

## 4. Threat Mitigation
| ภัย | กฎช่วยอย่างไร |
|-----|---------------|
| Mass spam fields | hasOnly() ปิดช่องเพิ่ม field แปลก |
| Projection poisoning | require exists(base doc) ก่อน create searchMetadata |
| Tamper createdAt | immutableCreatedAt ป้องกัน backdating |
| Large payload abuse | จำกัด length ทุก field |

## 5. ข้อเสนอถัดไป
- Lock delete achievements (ต้อง token / rate + soft-delete)
- Add counter function for views/likes (server mediated)
