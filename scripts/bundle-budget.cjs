#!/usr/bin/env node
/**
 * Simple bundle size budget checker.
 * Run AFTER build (dist/.svelte-kit or build output) and warn if any JS chunk exceeds threshold.
 */
const fs = require('fs');
const path = require('path');

// Adjust paths based on adapter; using .svelte-kit/output/client for dev or build for static export
const candidates = [
  '.svelte-kit/output/client',
  'build/_app/immutable/chunks'
];
const LIMIT_KB = parseInt(process.env.BUNDLE_LIMIT_KB || '180'); // default 180KB per chunk (compressed would be smaller)
let found = false;
for (const rel of candidates) {
  const p = path.join(process.cwd(), rel);
  if (!fs.existsSync(p)) continue;
  found = true;
  const files = fs.readdirSync(p).filter(f => f.endsWith('.js'));
  let failed = false;
  for (const f of files) {
    const sizeKB = fs.statSync(path.join(p,f)).size / 1024;
    if (sizeKB > LIMIT_KB) {
      console.warn(`[BUNDLE][WARN] ${f} ${(sizeKB).toFixed(1)}KB exceeds ${LIMIT_KB}KB budget`);
      failed = true;
    }
  }
  if (!failed) console.log(`[BUNDLE] All chunks within ${LIMIT_KB}KB budget in ${rel}`);
}
if (!found) {
  console.log('[BUNDLE] No candidate output directories found. Build first.');
}
