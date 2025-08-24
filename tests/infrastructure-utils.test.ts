import { describe, it, expect } from 'vitest';
import { enableEventBusDebug, on, off, emit, handlerCount } from '../src/lib/domain/events/event-bus';
import { rateLimit } from '../src/lib/infrastructure/security/rate-limit';
import { checkSpam } from '../src/lib/infrastructure/security/spam-detector';
import { computeSearchScore } from '../src/lib/domain/search/scoring';

describe('event-bus', () => {
  it('registers and emits handlers', async () => {
    let called = 0;
    const h = () => { called++; };
    on('x', h);
    expect(handlerCount('x')).toBe(1);
    await emit('x', {});
    expect(called).toBe(1);
    off('x', h);
    expect(handlerCount('x')).toBe(0);
  });
});

describe('rateLimit', () => {
  it('allows limited number then blocks', () => {
    const key = 'test:rl';
    let allowedCount = 0;
    for (let i=0;i<9;i++) {
      const r = rateLimit(key, 5, 5); // capacity 5
      if (r.allowed) allowedCount++;
    }
    expect(allowedCount).toBeLessThanOrEqual(5);
  });
});

describe('spam-detector', () => {
  it('flags forbidden patterns', () => {
    const res = checkSpam({ title: 'Free Money Offer', description: 'get free money now', ownerName: 'Test' });
    expect(res.ok).toBe(false);
  });
});

describe('semantic search scoring', () => {
  it('boosts phrase matches above single token partials', () => {
    const now = Date.now();
    const phrase = 'ผลงาน เด่นมาก';
    const a1 = computeSearchScore({ title: 'ผลงานเด่นมาก', createdAt: now }, phrase, now);
    const a2 = computeSearchScore({ title: 'ผลงาน เด่น มาก แยก ช่อง', createdAt: now }, phrase, now);
    expect(a1).toBeGreaterThanOrEqual(a2); // contiguous phrase should be >= split tokens
  });
});
