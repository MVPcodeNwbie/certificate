# CSP Enforcement Preparation

Current Report-Only header (firebase.json):
```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data: https://fonts.gstatic.com;
connect-src 'self' https://firestore.googleapis.com https://firebasestorage.googleapis.com;
object-src 'none';
frame-ancestors 'none';
base-uri 'self';
```

Planned additional sources (if/when used):
- `https://fonts.googleapis.com` (webfont stylesheet) – currently fonts may be bundled; add if external link used.
- `blob:` (if client-side image compression via canvas to blob + object URL not required in CSP)
- `worker-src 'self'` (if web workers introduced later)
- `img-src` add `blob:` for local previews before upload.

Action Steps Before Enforce:
1. Audit network requests in production (DevTools > Network, filter third-party).
2. Replace 'unsafe-inline' style with hashed Tailwind critical (optional) OR keep with rationale.
3. Add reporting endpoint (Report-To / report-uri) if violation telemetry needed.
4. Switch header key to `Content-Security-Policy` after 7 days clean report.

Optional future directives:
- `upgrade-insecure-requests;` when custom domain HTTPS ensured.
- `prefetch-src` for performance hints (if using preloads).

Decision Log:
- Keep inline styles minimal (Tailwind JIT) – allow 'unsafe-inline' short term.
- No external scripts; Firebase SDK bundled => keep script-src 'self'.

Ready for Enforcement After: no unexpected reports for 1 week.
