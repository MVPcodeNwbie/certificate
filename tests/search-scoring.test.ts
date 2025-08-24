import { describe, it, expect } from 'vitest';
import { computeSearchScore } from '../src/lib/domain/search/scoring';

describe('computeSearchScore', () => {
  it('gives highest boost for exact title match', () => {
    const now = Date.now();
    const scoreExact = computeSearchScore({ title: 'โครงการ A', createdAt: now }, 'โครงการ A', now);
    const scoreContains = computeSearchScore({ title: 'โครงการ A ดีเด่น', createdAt: now }, 'โครงการ A', now);
    expect(scoreExact).toBeGreaterThan(scoreContains);
  });

  it('adds multiple field contributions (title, description, issuer, owner, recency)', () => {
    const now = Date.now();
    // Use term present in all text fields
    const term = 'เด่น';
    const obj = {
      title: 'ผลงานเด่น', // contains term -> +50
      description: 'รายละเอียดเด่นเกี่ยวกับโครงงานเด่นมาก', // contains term -> +10
      issuer: 'สำนักเด่นศึกษา', // contains term -> +20
      ownerName: 'ครูเด่นสมชาย', // contains term -> +25
      createdAt: now
    };
    const score = computeSearchScore(obj, term, now);
    // Minimum expected = 50 + 10 + 20 + 25 (recency >=0). Allow for recency boost making it higher.
    expect(score).toBeGreaterThanOrEqual(105);
  });

  it('recency decays with age', () => {
    const now = Date.now();
    const recent = computeSearchScore({ title: 'งาน', createdAt: now }, 'งาน', now);
    const thirtyDays = 30 * 86400000;
    const older = computeSearchScore({ title: 'งาน', createdAt: now - thirtyDays }, 'งาน', now);
    expect(recent).toBeGreaterThan(older);
  });
});
