// Basic HTML sanitization tailored for plain-text oriented fields.
// Removes <script> tags, inline event handlers, and dangerous URLs (javascript:).
export function sanitizeInput<T extends Record<string, any>>(obj: T, fields: string[]): T {
  const clone: any = { ...obj };
  for (const f of fields) {
    const val = clone[f];
    if (typeof val === 'string') {
      let cleaned = val;
      cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      cleaned = cleaned.replace(/ on[a-z]+="[^"]*"/gi, '');
      cleaned = cleaned.replace(/javascript:/gi, '');
      // Collapse excessive whitespace
      cleaned = cleaned.replace(/\s{3,}/g, '  ');
      clone[f] = cleaned.trim();
    }
  }
  return clone;
}
