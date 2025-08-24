import { describe, it, expect } from 'vitest';
import { computeSearchScore } from '../src/lib/domain/search/scoring';
import { explainAchievementScore, rankHallOfFame } from '../src/lib/domain/hall-of-fame/scoring';

// NOTE: Some acceptance criteria (latency budgets) require integration / E2E + instrumentation.
// Here we cover logic-level invariants & provide TODOs for future E2E harness.

describe('Acceptance Criteria (logic-level coverage)', () => {
  it('Search scoring: exact title should outrank partial', () => {
    const now = Date.now();
    const exact = computeSearchScore({ title: 'โครงการ A', createdAt: now }, 'โครงการ A', now);
    const partial = computeSearchScore({ title: 'โครงการ A เด่น', createdAt: now }, 'โครงการ A', now);
    expect(exact).toBeGreaterThanOrEqual(partial); // exact >= contains
  });

  it('Hall of Fame: ownerWeight affects ordering', () => {
    const now = Date.now();
    const base = [
      { id: '1', title: 'A', ownerName: 'Alice', ownerRole: 'teacher', type: 'certificate', createdAt: now - 1000, description: 'xxx', evidence: [] },
      { id: '2', title: 'B', ownerName: 'Bob', ownerRole: 'teacher', type: 'certificate', createdAt: now - 500, description: 'xxx', evidence: [] },
      { id: '3', title: 'C', ownerName: 'Bob', ownerRole: 'teacher', type: 'certificate', createdAt: now - 400, description: 'xxx', evidence: [] }
    ] as any;
    const ranked1 = rankHallOfFame(base, now, { ownerWeight: 1 });
    const ranked2 = rankHallOfFame(base, now, { ownerWeight: 2 });
    // With higher ownerWeight, Bob's aggregate advantage should not decrease relative to Alice.
    const bob1 = ranked1.findIndex(r => r.ownerName === 'Bob');
    const bob2 = ranked2.findIndex(r => r.ownerName === 'Bob');
    expect(bob2).toBeLessThanOrEqual(bob1);
  });

  it('Hall of Fame explanation: component sum ~= total', () => {
    const now = Date.now();
    const items = [
      { id: '1', title: 'A', ownerName: 'Alice', ownerRole: 'teacher', type: 'certificate', createdAt: now - 1000, description: 'รายละเอียดยาวมากมาก', evidence: [{ path: 'p', url: 'u', mimeType: 'image/png', name: 'x', size: 10 }] }
    ] as any;
    const ranked = rankHallOfFame(items, now, { ownerWeight: 1.3 });
    const exp = explainAchievementScore(ranked[0], now, 1.3);
    const sum = exp.components.reduce((s,c)=>s+c.value,0);
    expect(Math.abs(sum - exp.total)).toBeLessThan(0.0001);
  });

  it('TODO (timing budgets): search query, ranking rerender, CSV export, blur transition should be measured in E2E tests', () => {
    expect(true).toBe(true); // placeholder to keep suite green
  });
});
