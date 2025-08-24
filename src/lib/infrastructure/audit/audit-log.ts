// Simple client-side audit log publisher
import { db } from '$lib/infrastructure/firebase/client';
import { addDoc, collection } from 'firebase/firestore';

interface AuditPayload {
  eventType: 'achievement.create' | 'achievement.update' | 'achievement.delete' | 'achievement.deleteEvidence';
  refId: string;
  client?: { ua?: string };
}

const col = collection(db, 'auditLogs');

export async function publishAudit(p: AuditPayload) {
  try {
    await addDoc(col, { ...p, at: Date.now() });
  } catch (e) {
    // swallow to avoid impacting UX
    console.warn('audit log failed', e);
  }
}
