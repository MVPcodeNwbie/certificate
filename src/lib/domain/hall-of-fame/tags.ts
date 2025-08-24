// Simple Thai + general tokenizer producing semantic tags for achievements
// Approach: lowercase, remove punctuation, split by spaces + Thai segmentation heuristic (basic)
// For Thai (no spaces) fallback to greedy sliding window of length 2-4 for words appearing >=2 times across fields (later refinement)

export interface TagContextInput {
  title: string;
  description?: string;
  issuer?: string;
  ownerName?: string;
  type?: string;
}

const STOP_WORDS = new Set<string>([
  'และ','หรือ','กับ','ของ','ที่','ให้','ใน','ได้','เป็น','ได้','โดย','เพื่อ','ปี','การ','งาน','ระดับ','ครั้ง','ครั้งที่','นี้','ฯ'
]);

export function extractTags(input: TagContextInput, max = 12): string[] {
  const parts: string[] = [];
  for (const v of [input.title, input.description, input.issuer, input.ownerName, input.type]) {
    if (!v) continue;
    parts.push(v.toLowerCase());
  }
  const raw = parts.join(' ')
    .replace(/[()"'“”‘’`,.;:!?/\\\[\]{}<>]|\s+/g, ' ') // normalize punctuation & whitespace
    .trim();
  const tokens = raw.split(' ').filter(Boolean);
  const freq: Record<string, number> = {};
  for (const t of tokens) {
    if (t.length < 2) continue;
    if (STOP_WORDS.has(t)) continue;
    freq[t] = (freq[t] || 0) + 1;
  }
  // Basic Thai segmentation heuristic: if no spaces present originally in title (pure Thai) we skip for now (future: integrate thai-segment lib)
  const scored = Object.entries(freq).map(([w,c]) => ({ w, c, score: c * (1 + Math.min(6, w.length)/10) }));
  scored.sort((a,b) => b.score - a.score);
  return scored.slice(0, max).map(s => s.w);
}

// Utility to update document payload with tags (called before create/update persistence)
export function deriveTagsForAchievement(a: TagContextInput): string[] {
  return extractTags(a);
}
