import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminFirestore } from '$lib/firebase/admin';
import { validateAchievement } from '$lib/domain/value-objects';
import { rateLimit } from '$lib/infrastructure/security/rate-limit';
import { _RATE_LIMIT_MESSAGE } from '../+server';
import { checkSpam } from '$lib/infrastructure/security/spam-detector';
import { sanitizeInput } from '$lib/infrastructure/security/sanitize';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const snap = await adminFirestore.collection('achievements').doc(params.id).get();
    if (!snap.exists) return json({ error: 'not found' }, { status: 404 });
    return json({ id: snap.id, ...snap.data() });
  } catch {
    return json({ error: 'server error' }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ params, request, getClientAddress }) => {
  try {
    let body = await request.json();
  body = sanitizeInput(body, ['title','description','issuer','ownerName','url']);
  const ip = getClientAddress();
  const rl = rateLimit(`update:${ip}`, 15, 15);
  if (!rl.allowed) return json({ error: _RATE_LIMIT_MESSAGE, errorCode: 'RATE_LIMIT' }, { status: 429 });
  const spam = checkSpam(body);
  if (!spam.ok) return json({ error: 'สงสัยเป็นสแปม: ' + spam.reasons.join('; '), errorCode: 'SPAM' }, { status: 400 });
  const v = validateAchievement(body, { isUpdate: true });
  if (!v.ok) return json({ error: v.errors.join('\n'), errorCode: 'VALIDATION' }, { status: 400 });
    body.updatedAt = Date.now();
    await adminFirestore.collection('achievements').doc(params.id).set(body, { merge: true });
    return json({ id: params.id, ...body });
  } catch {
    return json({ error: 'server error', errorCode: 'SERVER' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    await adminFirestore.collection('achievements').doc(params.id).delete();
    return json({ success: true });
  } catch {
    return json({ error: 'server error', errorCode: 'SERVER' }, { status: 500 });
  }
};
