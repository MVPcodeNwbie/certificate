# แผนการดำเนินงาน - ระบบบันทึกความสำเร็จ (Public CRUD Achievement System)
# คู่มือ sveltekit https://svelte.dev/llms-full.txt
## 🎯 ภาพรวมโครงการ

**ชื่อโครงการ:** ระบบบันทึกความสำเร็จแบบสาธารณะสำหรับสถานศึกษา  
**เทคโนโลยี:** SvelteKit + TailwindCSS + TypeScript + Firebase  
**ประเภทระบบ:** Public CRUD (ไม่ต้องล็อกอิน) สำหรับบันทึกผลงานของผู้บริหาร/ครู/นักเรียน

### 🔑 คุณสมบัติหลัก
- ✅ เปิดให้ทุกคนเพิ่ม/แก้ไข/ลบรายการได้
<!--
=================================================================================================
  ROADMAP VERSION 2 (REWRITTEN FOR CONSISTENCY, LINEAR FLOW & UX/UI COHERENCE)
  เป้าหมาย: ลดการ "กระโดด" งาน ให้ทุกอย่างไหลตามลำดับที่มีเหตุผล
  หลักการ: ทำเป็น LAYERS → Foundation → Domain → Form System → Listing/Search → Detail/Evidence → Analytics → Ranking → Security → Performance → Testing → Docs/Deploy
  หมายเหตุ: บันทึกสถานะ (Done / WIP / Todo) ชัดเจน + ระบุ Dependencies เพื่อไม่ข้ามขั้น
=================================================================================================
-->

# แผนการดำเนินงาน (v2) - ระบบบันทึกความสำเร็จสาธารณะ
อ้างอิงคู่มือ SvelteKit: https://svelte.dev/llms-full.txt

## 0. สรุปเป้าหมายระยะสั้น
1. เสถียร (Stable CRUD + ฟอร์ม 4 แท็บ UX ดี)  
2. ค้นหา/กรองเร็ว + คะแนนค้นหาฉลาด  
3. Hall of Fame มีคะแนนโปร่งใส/ปรับได้  
4. รายงานเชิงวิเคราะห์ + Export  
5. ป้องกันสแปม + ความปลอดภัย (Rules + Rate Limit + Duplicate)  
6. Performance (LQIP, Cache, Index)  
7. Testing + Docs ก่อน Production  

## 1. โครงสร้างการจัดกลุ่มใหม่ (Execution Streams)
| Stream | ชื่อ | เป้าหมาย | ลำดับทำ | สถานะ |
|--------|-----|----------|---------|--------|
| S1 | Foundation & Environment | โครงโปรเจค + Fonts + Rules พื้นฐาน | 1 | Done |
| S2 | Domain & Data Model | Entities / Value Objects / Repos | 2 | Done (บาง VO รอเพิ่ม) |
| S3 | Form System (4 Tabs) | ฟอร์มใช้งานง่าย + Validation Layer เดียว | 3 | Done (refined: progress + unsaved guard) |
| S4 | Listing & Search Core | /achievements + basic searchMetadata | 4 | Done (Ranking Improve ต่อ) |
| S5 | Detail & Evidence | แสดงผล + อัปโหลด/ลบ/rollback | 5 | Done |
| S6 | Analytics & Reports | Charts + Matrix + Export | 6 | Partial (Deep matrix ok) |
| S7 | Hall of Fame & Ranking | Scoring + Owner aggregation + Filters | 7 | Partial (Advanced signals later) |
| S8 | Security & Anti-Abuse | Rules Harden + Rate Limit + Duplicate | 8 | In Progress |
| S9 | Performance & UX Polish | LQIP + Cache + Split + Headers | 9 | In Progress |
| S10 | Testing & QA | Unit / Integration / Rules / UI | 10 | Early (basic tests) |
| S11 | Documentation & Deployment | Dev/User Docs + Prod config | 11 | In Progress |

## 2. มาตรฐาน UI & UX กลาง (Design Tokens & Patterns)
เพื่อความสอดคล้องทุกหน้า (ลด rework)

### 2.1 Design Tokens
| Token | ค่า / แนวทาง |
|-------|--------------|
| Colors (semantic) | primary=#2563eb, primary-hover=#1d4ed8, danger=#dc2626, warning=#d97706, success=#059669, surface=#ffffff, bg-muted=#f8fafc, border=#e2e8f0 |
| Radius | sm=4px, md=8px, lg=16px |
| Spacing Scale | 4,8,12,16,20,24,32,40 (คงที่ทั้ง layout + form) |
| Shadow levels | xs=none, sm=0 1px 2px rgba(0,0,0,.06), md=0 2px 6px rgba(0,0,0,.08), focus=outline 2px solid theme(primary) |
| Typography | Body: Sarabun 400; Heading: Mitr 500/600; Code: JetBrains Mono |
| Font Sizes TH | xs 12, sm 14, base 16, lg 18, xl 20, 2xl 24 (line-height ≥1.55) |

### 2.2 Components (Standard Props & Variants)
| Component | Variants | Props สำคัญ | Note |
|-----------|----------|-------------|------|
| Button | primary / secondary / ghost / danger | size (sm,md,lg) / loading / icon | Loading ใช้ spinner ขนาด 16px |
| Input/Textarea | default | error / helper / maxLength | แสดง counter เมื่อ >80% limit |
| Select | default | options[] / searchable? (later) | ใช้ slot สำหรับ label |
| Tabs | underline / segmented | activeIndex | ใช้ใน Form 4 แท็บ |
| Card | basic / interactive | hover / clickable | ใช้ AchievementCard |
| Modal/Dialog | center | size (sm,md,lg) | ปุ่มยืนยัน=primary, ยกเลิก=ghost |
| Skeleton | line / card / thumbnail | pulse boolean | ใช้ preload list & gallery |
| Toast | info / success / error | autoClose ms | Queue max 3 |

### 2.3 Interaction & Accessibility
1. Focus Visible: สีเส้นขอบ primary 2px (ไม่ใช้ box-shadow หนา)  
2. กด Enter ในฟอร์มไม่ข้ามแท็บ (ยืนยันเฉพาะปุ่ม explicit)  
3. ปุ่มอัปโหลดรองรับ drag + keyboard (aria-describedby ข้อจำกัดไฟล์)  
4. ใช้ aria-live="polite" สำหรับ Toast success / error  
5. สี Contrast ≥ 4.5:1 ข้อความบนพื้นหลังปุ่ม  

### 2.4 Layout & Navigation
| หน้า | โครงสร้างส่วนหัว | Secondary Actions | State Loading | Empty State |
|------|------------------|-------------------|--------------|-------------|
| Home | Hero + Stats + Latest | View All (Achievements) | Skeleton stats | "ยังไม่มีผลงานล่าสุด" |
| Achievements | Title + Filters bar (sticky) | New Achievement | Skeleton list (cards) | CTA เพิ่มผลงานแรก |
| New/Edit Form | Title + Step indicator (Tabs) | Cancel (กลับ listing) | Inline field skeleton | Draft guidance block |
| Detail | Breadcrumb + Title + owner chip | Edit / Delete / Share | Card skeleton | Not Found message |
| Reports | Title + Year filter + Export group | CSV / PDF / Print | Chart skeleton shimmer | "ยังไม่มีข้อมูลปีนี้" |
| Hall of Fame | Title + Filter row + Weight slider | Reset filters | Card skeleton | "ยังไม่มีคะแนนจัดอันดับ" |

## 3. ฟอร์ม 4 แท็บ (Focus Stream S3)
เป้าหมาย: ลด Cognitive Load, ไม่ยาวเกิน, สถานะจำได้ระหว่างสลับ, Validation real-time

| แท็บ | ชื่อ | ฟิลด์ | Validation | หมายเหตุ |
|------|------|-------|------------|----------|
| 1 | ข้อมูลทั่วไป | role, ownerName, category(type), title, description | required + length + title duplicate (async) | title normalize เก็บ normalizedTitle |
| 2 | ระดับพื้นที่ | orgLevel, orgNames[] | required orgLevel, orgNames length ≤5 | orgNames autocomplete (later) |
| 3 | ระยะเวลา | startDate, endDate?, academicYear, term? | date range valid, start <= end, year derive | academicYear derive + persist |
| 4 | หลักฐาน | files[] (image/pdf), remove each, reorder? (later) | size ≤5MB, mime allowlist | blurDataUrl สร้างหลัง upload |

### 3.1 ฟอร์ม Workflow
1. Local draft state (store)  
2. Autosave (optional future) – ปัจจุบันบันทึกเมื่อ Submit  
3. เมื่อ Submit: Validate → Upload Evidence (parallel) → Create Firestore Doc → Create searchMetadata → Audit Log → Update UI cache  
4. Rollback: หาก Firestore ล้มเหลว ลบไฟล์ที่อัปโหลดแล้ว  

### 3.2 Validation Layer
| ระดับ | ตำแหน่ง | ตัวอย่าง |
|-------|---------|----------|
| Synchronous | Value Object (Title, RoleType) | throw Error หากผิด | 
| Cross-field | usecase/service | start <= end | 
| Async External | Duplicate title check | query normalizedTitle 24h | 
| Security Rules | Firestore | schema, field whitelist | 

## 4. ลำดับการทำงาน (Execution Order Detailed)
เราจะไม่ข้าม stream โดยเปิด WIP สูงสุด 2 streams พร้อมกัน

1. S1 Foundation (DONE)  
2. S2 Domain Model (DONE partial VO refine later)  
3. S3 Form 4 Tabs (DONE – เพิ่ม UX polish: progress indicator % และ warn unsaved)  
4. S4 Listing & Search (DONE – ต่อยอด Ranking)  
5. S5 Detail & Evidence (DONE)  
6. S8 Security & Anti-Abuse (Harden + Spam heuristics)  
7. S7 Hall of Fame Advance (หลัง Security)  
8. S6 Analytics Extend (orgLevel dimension)  
9. S9 Performance (Code Split + Lighthouse)  
10. S10 Testing Expansion  
11. S11 Documentation Final + Deployment  

## 5. สถานะปัจจุบัน (Snapshot)
| หมวด | สถานะ | หมายเหตุ |
|-------|-------|----------|
| CRUD & Upload | Done | มี rollback orphan file |
| Form UX 4 Tabs | Done (Refine) | ต้องเพิ่ม unsaved warning + keyboard trap fix |
| searchMetadata | Done | Ranking heuristic basic + decay |
| Duplicate Detection | Done | 24h window normalizedTitle |
| Hall of Fame | Partial | Filters + ownerWeight slider OK; advanced signals pending |
| Reports | Partial | Deep matrix role×type×academicYear OK; org level dimension pending |
| LQIP / Images | Done | blurDataUrl + IntersectionObserver |
| Rate Limiting | Done (basic + sliding) | Frequency heuristics next |
| Firestore Rules | Hardened | searchMetadata restricted + CSP report collection |
| CSP Headers | Report + Enforced | Need audit inline styles before strict nonce |
| Tests | Early | value objects + lqip + rate/hof basic |
| Docs | Partial | Need architecture + rules rationale write-up |

## 6. งานคงเหลือ (Backlog จัดกลุ่ม + ไม่ข้ามลำดับ)
### 6.1 Refinements (Short)
- [x] เพิ่ม unsaved-change guard ในฟอร์ม (beforeNavigate)  
- [x] แสดง Step progress (เช่น 3/4) ในหัวฟอร์ม  
- [x] Unified error message mapping (ไทยสั้น/ชัด)  
- [x] HoF score explain panel: เพิ่ม dialog a11y (role=dialog, Escape close)  
- [x] HoF explain modal backdrop: role=button + keyboard handlers (Enter/Space/Escape)  
  - refined: switched backdrop to semantic <button> to clear Svelte a11y warnings (click + Escape)  
  - refined: removed click handler from non-interactive dialog container; separate backdrop button + focus management + Escape on wrapper  
  - refined: removed keydown listener from non-interactive div; added global Escape handler with lifecycle cleanup (clears final a11y warning)  

### 6.2 Security & Anti-Abuse (Active Stream)
- [x] Frequency heuristic: จำกัดจำนวนสร้าง (N ต่อ IP / 15 นาที)  
- [x] Forbidden terms list (คำหยาบ baseline)  
- [x] Content similarity (Levenshtein >80% ภายในช่วงเวลา)  
- [x] Actor enrichment: hash(IP+UA) เก็บใน achievement doc  

### 6.3 Hall of Fame Advanced
- [x] Semantic tags (tokenization + Thai segmentation – basic tokenizer implemented)  
- [x] Engagement placeholder fields (views, likes default 0)  
- [x] Score explain panel (แสดงองค์ประกอบคะแนน modal)  

### 6.4 Reports Extension
- [x] เพิ่มมิติ orgLevel ใน matrix + filter  
- [x] Year-over-year growth chart  
- [x] Export CSV โหมด wide matrix  

### 6.5 Search Improvement
- [x] Partial term boosting (prefix multi token)  
- [x] Owner/issuer weight tuner UI (advanced)  
- [x] Filter specification pattern (encapsulated object)  
- [x] Debounce + cancel stale queries  

### 6.6 Performance & Delivery
- [x] Dynamic import reports & hof modules  
- [x] Bundle size budget (warn > X KB)  
- [x] Preload critical fonts subset (latin+thai)  
- [x] Add serverTimestamp createdAtTs (decision) + index  

### 6.7 Testing Expansion
- [x] Firestore emulator rules tests (create/update/delete)  
- [x] Search ranking unit tests (weight changes)  
- [x] Hall of Fame score explanation tests  
- [x] Form e2e (tab navigation + validation states)  
- [x] Image pipeline test (blur fallback)

### 6.8 Documentation
- [x] Architecture diagram (C4 level 2 + data flow)  
- [x] Firestore rules rationale (field whitelist table)  
- [x] Scoring formulas (Search + Hall of Fame)  
- [x] Deployment checklist (indexes, headers, rules, env)  
- [x] User guide (เพิ่ม/แก้ไข/ลบ + แนวทางหลักฐาน)  

## 7. Acceptance Criteria (สำคัญสำหรับไม่หลุด Scope)
| Feature | Criteria |
|---------|----------|
| Form 4 Tabs | สลับแท็บไม่ล้างค่า, error ต่อ field, duplicate title เตือนภายใน ≤600ms |
| Upload & Rollback | หาก firestore create fail → ลบไฟล์ที่อัปเดตแล้วทั้งหมด |
| Search | Query ≤ 300ms (cache hit ≤50ms) หน้าแรก, relevance แสดง term highlight (later) |
| Hall of Fame | เปลี่ยน ownerWeight แล้ว ranking re-render ≤150ms (50 items) |
| Reports | Export CSV สำเร็จภายใต้ 2s (≤1k records) |
| Rate Limit | เกิน quota → ข้อความเตือนภายในรูปแบบเดียวกันทุก endpoint |
| LQIP | ภาพ full โหลดแล้ว blur transition ≤300ms fade |
| Security | Rules deny field นอก schema 100% test pass |
| Docs | Dev ใหม่อ่านแล้ว setup ≤30 นาที |

## 8. Risk & Mitigation (อัพเดทใหม่)
| ความเสี่ยง | ผลกระทบ | บรรเทา |
|------------|----------|---------|
| Abuse flood (burst) | ค่าใช้จ่าย/Spam | Sliding window + frequency heuristic |
| Ranking gaming (ซ้ำเล็กน้อย) | คุณภาพ HoF | Similarity detection + diminishing returns (มีแล้ว) |
| ภาพใหญ่/จำนวนมาก | UX ช้า | Client resize + blur + lazy + limit evidence count (soft warn >8) |
| Query cost searchMetadata | ค่าใช้จ่าย | จำกัด fields + selective indexing |
| Rules drift | ช่องโหว่ | Emulator CI test rules |

## 9. Implementation Guidelines (Do & Don't)
Do: เพิ่มฟิลด์ใหม่ → อัพเดตรายชื่อ allow ใน Rules, TypeScript types, searchMetadata mapping  
Do: ใช้ helper normalizer เดียวกัน (title → normalizedTitle)  
Do: แก้คะแนน → ใส่ comment สูตร + ปรับ unit tests  
Don't: เรียก Firestore ซ้ำเพื่อข้อมูลเดียว หาก cache ยัง valid  
Don't: Inject UI logic ใน repository (แยก concern)  

## 10. Definition of Done (ย่อปรับใหม่)
1. Code: Type-safe + ไม่มี unused export สำคัญ  
2. Tests: หน่วยสำคัญ (score, validation, rules) ผ่าน  
3. Security: Rules + rate limit path ครอบคลุม  
4. Performance: LCP < 2.5s (sample dev) หน้าแรก  
5. Docs: README + architecture + scoring + deployment  
6. UX: Consistent components + states (loading/empty/error)  

## 11. Update Log (ล่าสุด 2025-08-24)
สรุป (ต่อจากเวอร์ชันก่อน): Harden rules, duplicate detection, search decay, CSP report โครง, LQIP, HoF filters + ownerWeight, deep matrix reports, sliding + token rate limit, density scoring, vitest setup.  
เพิ่มใน v2: จัดกลุ่ม Streams, UI tokens, Form 4 Tabs spec, Backlog จัดระเบียบ, Acceptance Criteria ชัดเจน, Risk table ปรับใหม่

## 12. Next Immediate Focus (Lock WIP = 2)
Active: (1) Security & Anti-Abuse heuristics, (2) Form UX refine (unsaved guard)  
Queue หลังเสร็จ: Hall of Fame advanced signals → Reports orgLevel → Performance code split → Emulator rules tests → Docs expansion  

---
เอกสารนี้เป็น Roadmap เดียวที่ต้องอัพเดตเท่านั้น (งดสร้างเอกสาร roadmap ซ้ำ). การเปลี่ยนลำดับให้ผ่านส่วน "Next Immediate Focus" ทุกครั้งเพื่อเลี่ยง context jump.

.text-2xl-th { font-size: 1.5rem; line-height: 1.5; }

/* Tablet & Desktop */
@media (min-width: 768px) {
  .text-base-th { font-size: 1.125rem; line-height: 1.7; }
  .text-lg-th { font-size: 1.25rem; line-height: 1.6; }
}
```

### Accessibility for Thai Text
- **Minimum font size**: 16px สำหรับ body text บนมือถือ
- **Line height**: อย่างน้อย 1.6 สำหรับภาษาไทย
- **Contrast ratio**: อย่างน้อย 4.5:1 สำหรับ normal text
- **Word spacing**: เพิ่ม letter-spacing เล็กน้อยสำหรับ headings

## 📝 หมายเหตุ

- แผนนี้ยืดหยุ่นได้ตามความต้องการและทรัพยากรที่มี
- สามารถทำ Phase 2-3 แบบ parallel ได้เพื่อลดระยะเวลา
- แนะนำให้ทำ Demo ทุกสัปดาห์เพื่อ feedback เร็ว
- ควรมีการ backup และ version control ตลอดเวลา
- **Domain-Driven Design**: เน้นการแยก business logic ออกจาก infrastructure
- **Thai Typography**: ให้ความสำคัญกับการแสดงฟอนต์ไทยที่ถูกต้องและสวยงาม
- **Responsive Design**: รองรับการใช้งานบนอุปกรณ์มือถือด้วยฟอนต์ไทยที่เหมาะสม

---

*แผนนี้สร้างขึ้นจากการวิเคราะห์ context-based prompt ที่ให้มา ปรับใช้ Domain-Driven Design architecture และเพิ่มการรองรับฟอนต์ไทยอย่างครบถ้วน สามารถปรับแต่งได้ตามความต้องการจริง*

---

## 🎨 Theme & Styling Summary (ปัจจุบัน)

### 1. Color Palette (Success Gradient)
ใช้โทน “ความสำเร็จ” ไล่ระดับ: `#16a34a (green)` → `#22c55e (emerald)` → `#facc15 (gold)` → `#f59e0b (amber)` → `#f97316 (orange)`

หลักการใช้:
- Hero / Section highlight: `.hero-gradient`
- ปุ่มหลัก: `.btn-primary` (linear-gradient 90deg เฉดบางส่วนของชุดนี้)
- พื้นหลังเน้น: `.bg-success-gradient`
- ข้อความเน้นพิเศษ: `.text-success-gradient` (gradient clip)
- Active navigation: `.nav-link-active` ใช้ gradient เดียวกับปุ่มหลัก

ได้ถอดถอน palette เดิม (โทนฟ้า / blue primary) แล้ว เพื่อความสม่ำเสมอ หลีกเลี่ยงการเพิ่ม utility สีชุดเก่าในโค้ดใหม่

### 2. Typography
- ฟอนต์หลัก: Sarabun (ทั่วทั้งระบบ) – โหลดผ่าน `<link>` ใน `app.html`
- (แผน) ฟอนต์ Mitr สำหรับ heading / highlight สามารถเพิ่มภายหลัง (ยังไม่บังคับใช้ทั่วระบบ)
- Line-height และขนาดตามแนวทาง “Thai Typography Guidelines” ด้านบน

### 3. Components & Utility Classes
| หมวด | คลาส / องค์ประกอบ | บทบาท |
|------|--------------------|--------|
| Hero | `.hero-gradient` | พื้นหลัง gradient หลัก พร้อมข้อความสีดำ (#000) เพื่อปรับ contrast (เดิม #fff) |
| ปุ่ม | `.btn-primary`, `.btn-secondary`, `.btn-danger` | Variants: gradient / gray / red |
| เน้น BG | `.bg-success-gradient` | พื้นหลัง section / card highlight |
| เน้น Text | `.text-success-gradient` | ข้อความ gradient (ใช้ background-clip) |
| นำทาง | `.nav-link`, `.nav-link-active` | ลิงก์เมนู + สถานะหน้าใช้งาน (active = gradient + shadow) |
| เอฟเฟ็กต์ | `.animate-fade`, `.backdrop-blur-sm|md` | Animation + glass effect |

### 4. Accessibility & Contrast
- ปรับข้อความใน hero เป็นสีดำ (#000) เพราะช่วงกลางของ gradient (gold/amber) สว่าง → ข้อความสีขาว contrast ต่ำ
- ปุ่ม gradient ยังคงตัวหนังสือสีขาว (#fff) ผ่านการทดสอบ contrast พื้นที่เฉดเขียว/ส้มเข้ม ≥ WCAG AA โดยคร่าว
- แนะนำ: หากมีพื้นหลัง gradient อ่อนเพิ่มเติม ให้ใช้ชั้น overlay (เช่น `bg-white/70` + `backdrop-blur-sm`) หรือใช้ตัวหนังสือสี `#1f2937` (gray-800)

### 5. Naming & Conventions
- หลีกเลี่ยง hardcode สีใหม่ใน component ถ้า utility/class มีอยู่แล้ว → ใช้ `.bg-success-gradient`, `.btn-primary`, `.nav-link-active`
- หากต้องเพิ่มเฉดใหม่ ให้เพิ่มใน Tailwind config (extend.colors) ก่อน เพื่อป้องกันซ้ำซ้อน

### 6. Planned Enhancements (ถัดไป)
1. Outline / subtle button variant (ลด visual weight ใน secondary actions)
2. Dark mode (invert palette: ใช้ emerald/gold เป็น accent บนพื้นหลัง neutral 900)
3. Skeleton loaders (ใช้ shimmer gradient อ่อนเทา + เขียวหม่นเล็กน้อย)
4. Multi-file gallery: ใช้ background neutral + border gradient บางส่วน (1px) สำหรับ highlight ไฟล์พิเศษ
5. Theming tokenization (แยก CSS variables: `--color-success-1..5`) เพื่อรองรับการสลับธีมเร็ว

### 7. Quick Reference
```
Gradient stops: 0% #16a34a | 30% #22c55e | 55% #facc15 | 75% #f59e0b | 100% #f97316
Primary button gradient: 90deg (#16a34a → #22c55e → #f59e0b)
Hero text color: #000 (updated for contrast)
```

> สรุป: ธีมปัจจุบันเน้นอัตลักษณ์ “ความสำเร็จ / ก้าวหน้า” ด้วยเฉดเขียวถึงทองส้ม ไล่ระดับสร้างพลังและความอบอุ่น พร้อมฟอนต์ Sarabun ที่อ่านง่ายในภาษาไทย และคอนเซปต์ utility-first เพื่อคงความสม่ำเสมอและขยายต่อได้ง่าย

---

## 🔐 CI/CD & Secrets Status (ใหม่)

งานที่เพิ่งเพิ่ม: Workflows (`.github/workflows/deploy.yml`, `.github/workflows/rules-only.yml`) ถูกสร้างแล้ว แต่ยังไม่สามารถ deploy อัตโนมัติจนกว่าจะตั้งค่า secrets ต่อไปนี้ใน GitHub Repository Settings → Secrets → Actions:

| Secret | รายละเอียด | รูปแบบ |
|--------|-------------|--------|
| FIREBASE_SERVICE_ACCOUNT | Service Account JSON ที่มีสิทธิ์ deploy Hosting + Rules | JSON ทั้งก้อน (stringify) |
| FIREBASE_PROJECT_ID | Project ID ของ Firebase | เช่น `certificate-xxxx` |

ตัวอย่างการแปลง Service Account JSON เป็น secret:
1. ดาวน์โหลดไฟล์ service account (Role: Firebase Admin / Editor เพียงพอ)
2. เปิดไฟล์แล้ว copy เนื้อหา JSON ทั้งหมด ใส่ลง secret `FIREBASE_SERVICE_ACCOUNT`
3. ใส่ค่า project id ลง `FIREBASE_PROJECT_ID`

หลังตั้งค่า สามารถ trigger ได้โดย push ไปที่ branch `main` (deploy.yml) หรือ manual dispatch สำหรับ rules (`Rules Deploy`).

คำสั่งเทส workflow ในโลคัล (ทางเลือก) – ใช้ `act` (ถ้าจำเป็น) แต่ optional.

---

## 🛡️ CSP Plan (Draft Pending)

จะเพิ่ม CSP หลังตรวจสอบแหล่งที่มาทั้งหมดเพื่อลดการ break UI.

ร่างเริ่มต้น (ยังไม่ใส่):
```
Content-Security-Policy: default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://firestore.googleapis.com https://firebasestorage.googleapis.com; object-src 'none'; frame-ancestors 'none'; base-uri 'self';
```
ขั้นตอนก่อนเปิดใช้:
1. เปิด Report-Only ผ่าน header: `Content-Security-Policy-Report-Only`
2. เก็บ violations (เพิ่ม endpoint หรือใช้ report-uri service ภายนอก)
3. ปรับ whitelist แล้วค่อย switch เป็นบังคับจริง

---