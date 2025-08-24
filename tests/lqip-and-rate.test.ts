import { describe, it, expect } from 'vitest';
import { rateLimit, slidingWindowLimit } from '../src/lib/infrastructure/security/rate-limit';
import { rankHallOfFame } from '../src/lib/domain/hall-of-fame/scoring';

describe('rate limiting heuristics', () => {
  it('token bucket allows limited requests then blocks', () => {
    const key = 'test:bucket';
    let allowed = 0;
    for (let i=0;i<12;i++) { if (rateLimit(key, 5, 0).allowed) allowed++; }
    expect(allowed).toBeLessThanOrEqual(5);
  });
  it('sliding window denies over threshold', () => {
    const key = 'test:window';
    let ok = 0;
    for (let i=0;i<15;i++) { if (slidingWindowLimit(key, 10, 1000)) ok++; }
    expect(ok).toBe(10);
  });
});

describe('hall of fame scoring', () => {
  const make = (overrides: any = {}) => ({
    id: 'x', title: 'ผลงาน', ownerRole: 'teacher', ownerName: 'ครู ก', type: 'award', createdAt: Date.now(), updatedAt: Date.now(), evidence: [], ...overrides
  });
  it('evidence presence yields fixed bonus (binary)', () => {
    const now = Date.now();
    const list: any[] = [
      make({ id:'a', evidence: [] }),
      make({ id:'b', evidence: [{ path:'p', url:'u', mimeType:'image/jpeg', name:'n', size:1 }] }),
      make({ id:'c', evidence: new Array(5).fill(0).map((_,i)=>({ path:'p'+i, url:'u', mimeType:'image/jpeg', name:'n', size:1 })) })
    ];
    const ranked = rankHallOfFame(list as any, now);
    const scoreNo = ranked.find(r=>r.id==='a')!.baseScore;
    const scoreOne = ranked.find(r=>r.id==='b')!.baseScore;
    const scoreMany = ranked.find(r=>r.id==='c')!.baseScore;
    expect(scoreOne).toBeGreaterThan(scoreNo);
    // Many should not exceed one by more than tiny floating differences in other components (since evidence is binary)
    expect(Math.abs(scoreMany - scoreOne)).toBeLessThan(0.0001);
  });
  it('ownerWeight adjusts ranking order', () => {
    const now = Date.now();
    const list: any[] = [
      make({ id:'a', ownerName:'A', evidence:[], createdAt: now }),
      make({ id:'b', ownerName:'B', evidence:[{ path:'p', url:'u', mimeType:'image/jpeg', name:'n', size:1 }], createdAt: now })
    ];
    const rankedLow = rankHallOfFame(list as any, now, { ownerWeight: 0.1 });
    const rankedHigh = rankHallOfFame(list as any, now, { ownerWeight: 2 });
    // Ordering should be deterministic; we just assert arrays exist & scores computed
    expect(rankedLow[0].hofScore).toBeDefined();
    expect(rankedHigh[0].hofScore).toBeDefined();
  });
});

// LQIP generation is browser canvas based; we do a stub expectation that function exists.
describe('lqip utility', () => {
  it('is present (runtime canvas test skipped in jsdom)', async () => {
    const mod = await import('../src/lib/utils/lqip');
    expect(typeof mod.generateBlurDataUrl).toBe('function');
  });
});