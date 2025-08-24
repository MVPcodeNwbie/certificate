import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import fs from 'fs';
import path from 'path';

let testEnv: any;
const projectId = 'demo-test-project';

beforeAll(async () => {
  const host = process.env.FIRESTORE_EMULATOR_HOST?.split(':')[0] || '127.0.0.1';
  const port = process.env.FIRESTORE_EMULATOR_HOST?.split(':')[1];
  if (!port) {
    // Skip tests gracefully if emulator not running
    console.warn('Firestore emulator not detected (FIRESTORE_EMULATOR_HOST missing) - skipping rules tests');
    return;
  }
  const rules = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules, host, port: Number(port) }
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

function coll(db: any, c: string) { return db.collection(c); }

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('firestore security rules - achievements', () => {
  it('allows valid create and read', async () => {
    const ctx = testEnv.unauthenticatedContext();
    const db = ctx.firestore();
    const now = Date.now();
    await assertSucceeds(coll(db, 'achievements').doc('a1').set({
      title:'งานดี', normalizedTitle:'งานดี', description:'x', issuer:'y', date:'2025-01-01', ownerRole:'teacher', ownerName:'ครู ก', type:'certificate', createdAt: now, updatedAt: now, createdAtTs: now, evidence:[], actorHash:'h', tags:[], views:0, likes:0, orgLevel:'school', orgNames:['โรงเรียน ก']
    }));
    await assertSucceeds(coll(db, 'achievements').doc('a1').get());
  });
  it('rejects extra unexpected field', async () => {
    const ctx = testEnv.unauthenticatedContext();
    const db = ctx.firestore();
    const now = Date.now();
    await assertFails(coll(db, 'achievements').doc('bad1').set({
      title:'x', normalizedTitle:'x', ownerRole:'teacher', ownerName:'ครู ก', type:'certificate', createdAt: now, updatedAt: now, createdAtTs: now, evidence:[], actorHash:'h', views:0, likes:0, orgLevel:'school', evil:true
    } as any));
  });
  it('prevents createdAt mutation on update', async () => {
    const ctx = testEnv.unauthenticatedContext();
    const db = ctx.firestore();
    const now = Date.now();
    const ref = coll(db, 'achievements').doc('a2');
    await assertSucceeds(ref.set({
      title:'ต้นฉบับ', normalizedTitle:'ต้นฉบับ', ownerRole:'student', ownerName:'นักเรียน ก', type:'award', createdAt: now, updatedAt: now, createdAtTs: now, evidence:[], actorHash:'h', views:0, likes:0, orgLevel:'school'
    }));
    await assertFails(ref.update({ createdAt: now - 1000 }));
    await assertSucceeds(ref.update({ updatedAt: now + 5000 }));
  });
  it('allows delete (temporary policy)', async () => {
    const ctx = testEnv.unauthenticatedContext();
    const db = ctx.firestore();
    const now = Date.now();
    const ref = coll(db, 'achievements').doc('a3');
    await assertSucceeds(ref.set({
      title:'del', normalizedTitle:'del', ownerRole:'admin', ownerName:'ผู้บริหาร ก', type:'certificate', createdAt: now, updatedAt: now, createdAtTs: now, evidence:[], actorHash:'h', views:0, likes:0, orgLevel:'school'
    }));
    await assertSucceeds(ref.delete());
  });
});

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)('firestore security rules - searchMetadata', () => {
  it('rejects create when achievement missing', async () => {
    const ctx = testEnv.unauthenticatedContext();
    const db = ctx.firestore();
    await assertFails(coll(db,'searchMetadata').doc('unknown').set({ fullText:'x', title:'x', facets:{}, createdAt:Date.now() }));
  });
  it('allows create/update when achievement exists and forbids delete', async () => {
    const ctx = testEnv.unauthenticatedContext();
    const db = ctx.firestore();
    const now = Date.now();
    const achRef = coll(db,'achievements').doc('base');
    await assertSucceeds(achRef.set({ title:'t', normalizedTitle:'t', ownerRole:'teacher', ownerName:'ครู ข', type:'certificate', createdAt: now, updatedAt: now, createdAtTs: now, evidence:[], actorHash:'h', views:0, likes:0, orgLevel:'school' }));
    const smRef = coll(db,'searchMetadata').doc('base');
    await assertSucceeds(smRef.set({ fullText:'t ครู ข', title:'t', facets:{ role:'teacher' }, createdAt: now }));
    await assertSucceeds(smRef.update({ title:'t2', updatedAt: now+1 }));
    await assertFails(smRef.delete());
  });
});
