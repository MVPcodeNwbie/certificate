const FORBIDDEN_PATTERNS = [
  /viagra/i,
  /free money/i,
  /bitcoin giveaway/i,
  /porn/i,
  /xxx/i,
  /งานออนไลน์รายได้/i,
  /หาเงินเร็ว/i
];

export interface SpamCheckResult { ok: boolean; reasons: string[]; }

export function checkSpam(input: { title?: string; description?: string; ownerName?: string }): SpamCheckResult {
  const reasons: string[] = [];
  const text = `${input.title || ''} ${input.description || ''} ${input.ownerName || ''}`;
  for (const p of FORBIDDEN_PATTERNS) {
    if (p.test(text)) reasons.push(`พบรูปแบบต้องห้าม: ${p}`);
  }
  // Repetition heuristic: same char > 10 consecutive
  if (/(.)\1{10,}/.test(text)) reasons.push('มีการซ้ำตัวอักษรจำนวนมากผิดปกติ');
  if (text.split(/https?:\/\//i).length - 1 > 3) reasons.push('ลิงก์เยอะเกินไป');
  return { ok: reasons.length === 0, reasons };
}

// Basic similarity (Levenshtein distance ratio) for potential future use.
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const m = a.length, n = b.length;
  if (!m || !n) return 0;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i=0;i<=m;i++) dp[i][0] = i;
  for (let j=0;j<=n;j++) dp[0][j] = j;
  for (let i=1;i<=m;i++) {
    for (let j=1;j<=n;j++) {
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,
        dp[i][j-1] + 1,
        dp[i-1][j-1] + cost
      );
    }
  }
  const dist = dp[m][n];
  const maxLen = Math.max(m, n);
  return 1 - dist / maxLen;
}
