import { describe, it, expect } from 'vitest';
import { explainAchievementScore, rankHallOfFame } from '../src/lib/domain/hall-of-fame/scoring';

const base = (over: any = {}) => ({ id:'x', title:'ผลงาน เด่น', ownerRole:'teacher', ownerName:'ครู ก', type:'award', createdAt: Date.now(), updatedAt: Date.now(), evidence: [], ...over });

describe('Hall of Fame explainAchievementScore', () => {
  it('components sum to total (approx rounding)', () => {
    const ranked = rankHallOfFame([base()], Date.now(), { ownerWeight: 1 });
    const exp = explainAchievementScore(ranked[0], Date.now(), 1);
    const sum = exp.components.reduce((a,c)=>a + c.value, 0);
    // allow small floating point diff
    expect(Math.round(sum)).toBe(Math.round(exp.total));
  });
  it('includes owner bonus component', () => {
    const ranked = rankHallOfFame([base({ evidence:[{ path:'p', url:'u', mimeType:'image/jpeg', name:'n', size:1 }] })], Date.now(), { ownerWeight: 1.5 });
    const exp = explainAchievementScore(ranked[0], Date.now(), 1.5);
    const labels = exp.components.map(c=>c.label.toLowerCase());
    expect(labels.some(l=>l.includes('ownerbonus'))).toBe(true);
  });
});
