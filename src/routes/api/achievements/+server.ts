import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$lib/firebase/admin';
import { validateAchievement } from '$lib/domain/value-objects';
import { rateLimit, slidingWindowLimit, frequencyWindowLimit } from '$lib/infrastructure/security/rate-limit';

// Unified rate limit error message (Acceptance Criteria 7). Underscore to avoid framework export validation.
export const _RATE_LIMIT_MESSAGE = 'ขออภัย ส่งคำขอบ่อยเกินกำหนด โปรดรอแล้วลองใหม่';
import { checkSpam, similarity } from '$lib/infrastructure/security/spam-detector';
import { sanitizeInput } from '$lib/infrastructure/security/sanitize';
import { getDocs, query, collection, where, limit, orderBy } from 'firebase/firestore';
import { db } from '$lib/infrastructure/firebase/client';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  try {
    let body = await request.json();
  body = sanitizeInput(body, ['title','description','issuer','ownerName','url']);
  // Rate limit per IP
  const ip = getClientAddress();
  const rl = rateLimit(`create:${ip}`, 8, 8); // token bucket
  const slidingOk = slidingWindowLimit(`createWin:${ip}`, 20, 5*60000);
  const freq = frequencyWindowLimit(`createFreq:${ip}`, 30, 15*60000); // 30 / 15 นาที
  if (!rl.allowed || !slidingOk || !freq.allowed) {
  return json({ error: _RATE_LIMIT_MESSAGE, errorCode: 'RATE_LIMIT' }, { status: 429 });
  }
  const spam = checkSpam(body);
  if (!spam.ok) return json({ error: 'สงสัยเป็นสแปม: ' + spam.reasons.join('; ') , errorCode: 'SPAM' }, { status: 400 });
  const v = validateAchievement(body, { isUpdate: false });
  if (!v.ok) return json({ error: v.errors.join('\n'), errorCode: 'VALIDATION' }, { status: 400 });
    const now = Date.now();
  const normalizedTitle = body.title.trim().toLowerCase().replace(/\s+/g,' ');
    // Duplicate detection (recent 24h same normalizedTitle + ownerName + type)
    try {
      const twentyFourHrsAgo = now - 86400000;
      const qDup = query(
        collection(db, 'achievements'),
        where('normalizedTitle','==', normalizedTitle),
        where('ownerName','==', body.ownerName),
        where('type','==', body.type),
        limit(3)
      );
      const dupSnap = await getDocs(qDup);
      if (!dupSnap.empty) {
        const anyRecent = dupSnap.docs.some(d => (d.data() as any).createdAt >= twentyFourHrsAgo);
  if (anyRecent) return json({ error: 'รายการนี้ (ชื่อเดียวกัน) ถูกเพิ่มแล้วเมื่อไม่นานนี้', errorCode: 'DUPLICATE' }, { status: 409 });
      }
    } catch {}
    // Similarity heuristic (avoid near-duplicate spam with minor variations)
    try {
      const recentQ = query(collection(db,'achievements'), orderBy('createdAt','desc'), limit(15));
      const recentSnap = await getDocs(recentQ);
      const SIM_THRESHOLD = 0.85;
      const recentSimilar = recentSnap.docs.some(d => {
        const dt = d.data() as any;
        if (!dt?.title) return false;
        // quick length filter
        if (Math.abs((dt.title as string).length - body.title.length) > 40) return false;
        const s = similarity(normalizedTitle, (dt.normalizedTitle||dt.title).toLowerCase());
        return s >= SIM_THRESHOLD;
      });
  if (recentSimilar) return json({ error: 'มีรายการชื่อใกล้เคียงมากอยู่แล้ว โปรดลองปรับชื่อให้ต่างขึ้น', errorCode: 'SIMILAR' }, { status: 409 });
    } catch {}
    const userAgent = request.headers.get('user-agent') || '';
    const actorHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip + '|' + userAgent));
    const actorHashHex = Array.from(new Uint8Array(actorHash)).map(b=>b.toString(16).padStart(2,'0')).join('');
  const doc = {
      title: body.title,
      normalizedTitle,
      description: body.description || '',
      issuer: body.issuer || '',
      date: body.date || '',
      ownerRole: body.ownerRole,
      ownerName: body.ownerName,
      type: body.type,
      url: body.url || '',
      filePath: body.filePath || '',
      fileUrl: body.fileUrl || '',
      createdAt: now,
      updatedAt: now,
      actorHash: actorHashHex.slice(0,40) // truncated to save space
    };
    const ref = await adminFirestore.collection('achievements').add(doc);
  return json({ id: ref.id, ...doc });
  } catch (e) {
    console.error(e);
    return json({ error: 'server error', errorCode: 'SERVER' }, { status: 500 });
  }
};
