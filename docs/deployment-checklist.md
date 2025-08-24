# Deployment Checklist

## 1. Pre-Deploy
- [ ] Run tests: `npm test` (ensure no failures)
- [ ] Lint & types: `npm run check`
- [ ] Build: `npm run build`
- [ ] Bundle budget: `npm run budget` (review warnings)

## 2. Firebase
- [ ] Firestore indexes (deploy existing) `firebase deploy --only firestore:indexes`
- [ ] Firestore rules `firebase deploy --only firestore:rules`
- [ ] Storage rules `firebase deploy --only storage:rules`
- [ ] Enable Firestore TTL (optional future for logs)

## 3. Environment Variables (.env)
| Var | Purpose |
|-----|---------|
| VITE_FIREBASE_API_KEY | Client config |
| VITE_FIREBASE_PROJECT_ID | Project id |
| VITE_FIREBASE_STORAGE_BUCKET | Storage bucket name |
| (Optional) ANALYTICS_ID | Future analytics |

## 4. Security Headers (Reverse Proxy / Hosting)
| Header | Value (base) |
|--------|-------------|
| Content-Security-Policy | (Start in Report-Only) |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |

## 5. Post-Deploy Verification
- [ ] Create sample achievement (with image) ok
- [ ] Search returns within <300ms (dev tools sampling)
- [ ] Hall of Fame renders & explain modal opens
- [ ] Reports page dynamic charts load
- [ ] No CSP violations (after enabling report)

## 6. Rollback Plan
- Static build: keep previous build folder artifact
- Firestore: export daily backup (optional manual)
