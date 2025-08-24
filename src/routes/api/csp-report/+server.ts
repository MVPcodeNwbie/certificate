import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { adminFirestore } from '$lib/firebase/admin';

// Accept CSP reports (Report-To or report-uri style). Expect JSON body.
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  try {
    const ip = getClientAddress();
    const body = await request.json().catch(() => ({}));
    // Support both standard report body shapes
    const report = (body['csp-report'] || body.report || body) as any;
    const doc = {
      ts: Date.now(),
      ua: request.headers.get('user-agent') || 'unknown',
      ipHash: hashIp(ip),
      blockedURI: report['blocked-uri'] || report.blockedURI || null,
      documentURI: report['document-uri'] || report.documentURI || null,
      violatedDirective: report['violated-directive'] || report.violatedDirective || null,
      originalPolicy: report['original-policy'] || report.originalPolicy || null
    };
    await adminFirestore.collection('cspReports').add(doc);
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false });
  }
};

function hashIp(ip: string) {
  try {
    let h = 0;
    for (let i=0;i<ip.length;i++) h = (h*31 + ip.charCodeAt(i)) >>> 0;
    return h.toString(16);
  } catch { return '0'; }
}