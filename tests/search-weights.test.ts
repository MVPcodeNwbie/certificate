import { describe, it, expect } from 'vitest';
import { computeSearchScore, defaultSearchWeights } from '../src/lib/domain/search/scoring';

describe('search ranking weight changes', () => {
  it('increasing ownerNameWeight raises relative score', () => {
    const now = Date.now();
    const baseObj = { title:'โครงการ พัฒนา', ownerName:'สมชาย', createdAt: now };
    const term = 'สมชาย';
    const base = computeSearchScore(baseObj, term, now, { ...defaultSearchWeights });
    const boosted = computeSearchScore(baseObj, term, now, { ...defaultSearchWeights, ownerNameWeight: defaultSearchWeights.ownerNameWeight * 2 });
    expect(boosted).toBeGreaterThan(base);
  });
  it('partial token boost applies with configured factors', () => {
    const now = Date.now();
    const obj = { title:'รางวัล เด่นยอดเยี่ยม', ownerName:'ครู ก', issuer:'สำนัก การศึกษา', createdAt: now };
    const term = 'เด่น ยอด';
    const w1 = computeSearchScore(obj, term, now, { ...defaultSearchWeights, partialTokenTitleBoost: 10 });
    const w2 = computeSearchScore(obj, term, now, { ...defaultSearchWeights, partialTokenTitleBoost: 40 });
    expect(w2).toBeGreaterThan(w1);
  });
});
