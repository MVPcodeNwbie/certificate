import { describe, it, expect } from 'vitest';
import { rankHallOfFame, explainAchievementScore } from '../src/lib/domain/hall-of-fame/scoring';

const now = Date.now();
const base = (over: any = {}) => ({ id: Math.random().toString(36).slice(2), title: 'x', ownerRole: 'teacher', ownerName: 'A', type: 'training', createdAt: now, updatedAt: now, ...over });

describe('Hall of Fame description supplemental fields', () => {
  it('supplemental training fields increase description component', () => {
    const a1 = base({ description: 'หลักสูตรอบรมการสอน' });
    const a2 = base({ description: 'หลักสูตรอบรมการสอน', trainingBenefits: 'ได้พัฒนาทักษะการใช้สื่อดิจิทัลอย่างมีประสิทธิภาพ', trainingNextActions: 'นำไปจัด workshop ภายในโรงเรียน', trainingHours: 24 });
    const ranked = rankHallOfFame([a1, a2], now);
    const e1 = explainAchievementScore(ranked.find(r=>r.id===a1.id)!, now);
    const e2 = explainAchievementScore(ranked.find(r=>r.id===a2.id)!, now);
    const d1 = e1.components.find(c=>c.label==='description')!.value;
    const d2 = e2.components.find(c=>c.label==='description')!.value;
    expect(d2).toBeGreaterThan(d1);
  });
});
