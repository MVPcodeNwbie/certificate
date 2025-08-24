# สถาปัตยกรรมระบบ (Architecture)

## 1. C4 Model (Level 2 Container)
```
System: Public Achievement Recording Platform

Actors:
  - Anonymous User (Browser)

Containers:
  1. Web App (SvelteKit + TypeScript)
     - Renders UI, validation, image optimize, search score client-side
  2. Firebase Firestore (NoSQL DB)
     - Collections: achievements, searchMetadata, auditLogs, cspReports
  3. Firebase Storage
     - Evidence files (images/PDF) + generated thumbnails
  4. (Future) CDN Edge Cache (Static build outputs)

Relationships:
  User -> Web App: HTTP(S) requests
  Web App -> Firestore: CRUD (achievements, searchMetadata) under Rules
  Web App -> Storage: Signed upload → direct PUT, metadata via /api/artifact
  Web App -> Cloud Functions (index.js minimal placeholder) (future scoring jobs)
```

## 2. Data Flow (Create Achievement)
1. User fills 4-tab wizard
2. Local validation (value objects + cross-field)
3. Optimize images (resize + compress + optional thumbnail, blurDataUrl)
4. Rate / spam heuristic (client) prior to submit
5. Firestore `achievements` create (includes actorHash, orgLevel, etc.)
6. Projection: `searchMetadata` doc (fullText, facets) (same client transaction-like sequence)
7. Audit log entry (append-only)
8. UI cache/update list & ranking recompute (in-memory)

## 3. Collections Summary
| Collection | Purpose | Write Policy | Notes |
|------------|---------|--------------|-------|
| achievements | Canonical achievement records | Open create/update/delete with strict schema | Public read |
| searchMetadata | Denormalized search projection | Only if base doc exists; no delete | Prevents arbitrary spam injection |
| auditLogs | Append user actions | Create only | Hidden from public |
| cspReports | Store CSP violations | Create only | For tightening headers |

## 4. Client Modules (Logical)
| Layer | Responsibility |
|-------|----------------|
| domain | Value objects, scoring formulas (search/HOF) |
| application | Use cases (CreateAchievement), search service, stores |
| infrastructure | Firebase adapters, repositories, rate limit, spam detector |
| presentation | Svelte components (cards, modals, pages) |
| utils | Image optimization, LQIP, upload |

## 5. Ranking & Search Path
User Search → Query Firestore (prefix / facets) → Client scoring (computeSearchScore) → Weight tuning store → Sorted display.

## 6. Performance Hooks
- Dynamic imports: charts, HOF scoring, PDF libs
- Image LQIP & IntersectionObserver lazy load
- Bundle budget script for size regression warning

## 7. Security Layers
1. Firestore Rules (schema whitelist + projection dependency)
2. Client heuristics (rateLimit, similarity, forbidden terms)
3. Actor hash (IP+UA) for future abuse correlation
4. CSP (report-only → enforced plan)

## 8. Future Extension Points
- Cloud Function for periodic ranking snapshots
- SearchMetadata rebuild job
- Engagement (views/likes) aggregation with incremental updates
