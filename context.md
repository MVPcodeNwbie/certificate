ไฟล์ `context-engineering.md` ฉบับเต็มด้านล่าง — พร้อมใช้ มีข้อจำกัดความยาวไฟล์ 500 คำต่อไฟล์ และเน้น UX/UI สวยงาม ทันสมัย น่าใช้งาน.

# Context engineering: ระบบเก็บผลงาน รางวัล การอบรม (เว็บแอป)

## สรุปสั้น

สร้าง AI assistant เพื่อช่วยออกแบบ พัฒนา และให้โค้ดตัวอย่างสำหรับเว็บแอปจัดเก็บผลงาน รางวัล และการอบรมของผู้บริหาร ครู นักเรียน.
สแต็กหลัก: SvelteKit, Firebase (Firestore, Storage, Auth, Functions), TailwindCSS, search engine (Algolia / Typesense / Meilisearch).
ข้อจำกัด: ไฟล์เอกสารและคำอธิบายโค้ดแต่ละไฟล์ไม่เกิน 500 คำ.

---

## เป้าหมายเชิงพฤติกรรมของ AI assistant

1. อธิบาย domain entities และ bounded contexts แบบ DDD.
2. แนะนำ Firestore schema และ Storage layout ที่เหมาะสมกับ read-heavy UI.
3. สร้างตัวอย่าง SvelteKit routes, upload flow, Cloud Function skeletons, และ security rules.
4. ให้แนวทางการเชื่อมกับ search provider และ pipeline สำหรับ real-time sync + backfill.
5. ออกแบบ UI/UX แบบโมเดิร์น พร้อม component spec, accessibility notes และตัวอย่างโค้ด Tailwind สั้น ๆ.
6. ให้ชุดทดสอบ ตัวอย่าง CI/CD และ checklist ส่งมอบ.

---

## สแต็กและไลบรารี (แนะนำใช้รุ่นล่าสุด)

* SvelteKit
* Firebase (Firestore, Auth, Storage, Functions)
* TailwindCSS
* Search provider: Algolia หรือ Typesense (เลือก 2 ตัวเลือกพร้อมเหตุผลในเอกสารแยก)
* Thumbnailing: sharp (Cloud Functions)
* E2E: Playwright หรือ Cypress

---

## Domain Driven Design (high level)

* Bounded contexts: `People`, `Artifacts`, `Training`, `Search`, `Presentation`.
* Entities: `User` (role), `Artifact` (award/certificate/training), `CertificateFile`, `HallOfFameEntry`.
* Usecases: create/edit artifact, upload certificate, filter/search, hall-of-fame ranking, profile pages.

---

## Firestore schema (ตัวอย่าง)

```json
/users/{userId} {
  role, name:{first,last,display}, email, schoolId, photoUrl, createdAt
}
/artifacts/{artifactId} {
  ownerId, title, type, date, level, organization, description,
  trainingDetails?: { format, durationHours, benefits, outcomes },
  certificateFiles: [{ path, url, mimeType, sizeBytes }],
  tags, visibility, createdAt, updatedAt
}
/hallOfFame/config { criteria, weights }
/searchMetadata/{artifactId} { fullText, facets }
```

---

## Storage layout

```
gs://<bucket>/certificates/{schoolId}/{ownerId}/{artifactId}/{filename}
- enforce size <= 1_048_576 bytes
- allowed: application/pdf, image/jpeg, image/png, image/webp
- store thumbnails: /thumbnails/{...}
```

---

## Security rules (high level)

* Firestore rules: read public or owner or same-school; write by owner/admin only.
* Storage rules: validate mimeType, size, auth.
* Use custom claims for role-based access.
* Validate server-side in callable endpoints.

---

## Search strategy

* Firestore for primary storage. ใช้ external search for full-text + facets.
* Index fields: owner name, title, description, training.benefits, tags, organization, level, date.
* Support partial name matches, fuzzy, prefix, and facet filters (type, level, school, year).
* Pipeline: Cloud Function onCreate/onUpdate -> push to search index. Backfill job available.

---

## API / Route mapping (SvelteKit)

* `GET /` Hall of Fame (paged + facets)
* `GET /profile/[userId]` profile + artifacts (requires auth validation)
* `GET /artifact/[id]` detail + viewer
* `POST /api/upload` returns signed upload URL (validates Authorization header + size/type)
* `POST /api/artifact` create metadata after upload (validates token/session)
* `GET /api/search` proxy to search provider (optional auth for private results)
* `POST /api/auth/validate` internal endpoint to validate external tokens

---

## Client upload flow (recommended)

**Authentication Context:**
- Authentication handled externally by main system.
- Server endpoints must validate incoming token/header with internal auth service.
- Expect either:
  - Authorization: Bearer <token>
  - or headers: x-user-id, x-school-id (validated by server)
- Do not implement client-side login. Client only forwards existing session token.

**Upload Steps:**
0) ผู้ใช้ล็อกอินในระบบหลักแล้ว. Client จะส่ง token/header เดียวกันเมื่อเรียก /api/upload.
1) Client ตรวจขนาด/ชนิดไฟล์ก่อนอัพโหลด (<=1 MB; pdf/jpg/png/webp).
2) POST /api/upload (รวม metadata: filename,size,mime,artifactMeta) พร้อม Authorization header.
3) Server ตรวจ token ผ่าน internal auth service -> คืน signed upload URL.
4) Client PUT ไปยัง signed URL แล้วแจ้ง server เพื่อบันทึก metadata ใน Firestore.
5) Cloud Function จัด thumbnail + index ตาม pipeline.

---

## UX / UI Design — แนวทางสวยงาม ทันสมัย น่าใช้งาน

* โทนสี: ใช้ system tokens — primary, surface, accent, neutral. เลือก palette สงบแต่สด เช่น navy/teal/accent coral.
* Typography: หัวเรื่องใหญ่ใช้ 700 weight, body 400, ช่วงตัวอักษร 1.125–1.25rem.
* Layout: หน้าหลักเป็น responsive grid. Card-based design สำหรับ Artifact. กริด 1/2/3 คอลัมน์ตาม breakpoint.
* Card design: rounded 12px, soft shadow, thumbnail top, metadata row, action buttons minimal.
* Filters: left drawer บน desktop; top collapsible on mobile. Use chips for active filters.
* Search bar: large, centered, supports autocomplete and name suggestion.
* Hall of Fame: hero carousel for top entries + masonry grid for list. Highlight badge สีนูนและ microinteraction เมื่อ hover.
* Forms: ใช้ progressive disclosure. อัพโหลดแบบ drag-and-drop พร้อม preview และ compression progress.
* Microinteractions: subtle scale on hover, skeleton loaders, toast confirmations. ใช้ motion library สำหรับ transition แบบนุ่มนวล.
* Accessibility: semantic HTML, keyboard nav, aria labels, color contrast >= 4.5:1.
* Example Tailwind tokens: spacing scale 4/8/12, rounded-xl, shadow-md.
* Design system: สร้างชุด components (Button, Card, Modal, Input, Chips, Avatar) ให้สอดคล้องกับ tokens.

---

## Hall of Fame rules

* Configurable criteria: recency, level weight, votes, admin boost.
* Precompute rankings nightly and store `/hallOfFame/entries` เพื่อเรนเดอร์เร็ว.

---

## Non-functional requirements

* ข้อกำหนดความยาวไฟล์: ทุกไฟล์เอกสารและคำอธิบายต้องไม่เกิน 500 คำต่อไฟล์ เพื่อให้ง่ายต่อการอ่าน ส่งมอบ และอัปเดต หากเนื้อหามากให้แบ่งเป็นหลายไฟล์ย่อย.
* File size: certificate <= 1 MB. Client-side compress.
* Security: RBAC, validate uploads, optional virus scanning.
* Performance: pagination, CDN for thumbnails, cache search responses.
* Privacy: PII minimization, user-controlled visibility.
* Accessibility: WCAG 2.1 AA.

---

## Testing & QA

* Unit tests for validators and components.
* Integration tests for upload flow and search.
* E2E: Playwright/Cypress for core user journeys.
* Monitoring: error tracking and function logs.

---

## CI / Deployment

* Monorepo: `apps/web` + `functions`.
* CI steps: lint, typecheck, unit tests, build, deploy.
* Deploy web to Vercel/Netlify. Functions via Firebase CLI.
* Store secrets in CI env vars.

---

## Dependencies (starter)

* `@sveltejs/kit`
* `firebase` (modular SDK)
* `tailwindcss`
* `algoliasearch` or `typesense` client
* `sharp` (for functions)
* `playwright` / `cypress` (tests)

---

## Dev checklist (minimal)

* [ ] Firestore schema and indexes defined.
* [ ] Storage bucket and rules.
* [ ] Cloud Functions: thumbnail + search sync + backfill.
* [ ] Auth and role claims.
* [ ] Presigned upload endpoint.
* [ ] Search provider configured.
* [ ] UI components and accessibility audit.
* [ ] E2E tests and CI green.

