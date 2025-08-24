// Simple in-memory rate limiter (per IP-ish key). Suitable only for single-instance / dev.
interface Bucket { tokens: number; updatedAt: number; }
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, capacity = 10, refillPerMinute = 10): { allowed: boolean; remaining: number } {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) { b = { tokens: capacity, updatedAt: now }; buckets.set(key, b); }
  const elapsedMin = (now - b.updatedAt) / 60000;
  if (elapsedMin > 0) {
    b.tokens = Math.min(capacity, b.tokens + elapsedMin * refillPerMinute);
    b.updatedAt = now;
  }
  if (b.tokens >= 1) {
    b.tokens -= 1;
    return { allowed: true, remaining: Math.floor(b.tokens) };
  }
  return { allowed: false, remaining: 0 };
}

// Sliding window counter (secondary heuristic) - simple implementation
const windowHits = new Map<string, number[]>(); // key -> timestamps array (trimmed)
export function slidingWindowLimit(key: string, maxInWindow: number, windowMs: number): boolean {
  const now = Date.now();
  let arr = windowHits.get(key);
  if (!arr) { arr = []; windowHits.set(key, arr); }
  // remove old
  while (arr.length && now - arr[0] > windowMs) arr.shift();
  if (arr.length >= maxInWindow) return false;
  arr.push(now);
  return true;
}

// Frequency window (explicit count within longer window – separate from sliding to allow different semantics)
const frequencyHits = new Map<string, number[]>();
export function frequencyWindowLimit(key: string, max: number, windowMs: number): { allowed: boolean; count: number } {
  const now = Date.now();
  let arr = frequencyHits.get(key);
  if (!arr) { arr = []; frequencyHits.set(key, arr); }
  // trim
  while (arr.length && now - arr[0] > windowMs) arr.shift();
  if (arr.length >= max) return { allowed: false, count: arr.length };
  arr.push(now);
  return { allowed: true, count: arr.length };
}
