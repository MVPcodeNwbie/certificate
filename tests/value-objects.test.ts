import { describe, it, expect } from 'vitest';
import { validateAchievement, AcademicYear, DateRange } from '../src/lib/domain/value-objects';

describe('validateAchievement', () => {
  it('accepts valid minimal achievement', () => {
    const { ok, errors } = validateAchievement({ title: 'Test', ownerRole: 'teacher', ownerName: 'Teacher A', type: 'certificate', orgLevel: 'school' } as any);
    expect(ok).toBe(true);
    expect(errors.length).toBe(0);
  });

  it('rejects invalid title length', () => {
    const { ok, errors } = validateAchievement({ title: '', ownerRole: 'teacher', ownerName: 'AA', type: 'certificate' });
    expect(ok).toBe(false);
    expect(errors.some(e=>e.includes('ชื่อเรื่อง'))).toBe(true);
  });

  it('derives academic year correctly (Thai BE) for date after May', () => {
    const ay = AcademicYear.create('2025-06-01'); // Gregorian June 2025 -> BE 2568 academic year start 2025
    expect(ay?.toNumber()).toBeGreaterThan(2567);
  });

  it('validates future date not beyond 1 year', () => {
    const future = new Date(); future.setFullYear(future.getFullYear() + 2);
    const iso = future.toISOString().slice(0,10);
    const { ok, errors } = validateAchievement({ title: 'X', ownerRole: 'teacher', ownerName: 'AA', type: 'certificate', date: iso });
    expect(ok).toBe(false);
    expect(errors.some(e => e.includes('1 ปี'))).toBe(true);
  });
});
