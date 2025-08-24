export interface SearchAchievementLike {
  title?: string;
  description?: string;
  issuer?: string;
  ownerName?: string;
  createdAt?: number; // epoch ms
}

export interface SearchWeightConfig {
  issuerWeight: number; // base weight when issuer contains term
  ownerNameWeight: number; // base weight when owner name contains term
  partialTokenTitleBoost: number; // per token prefix boost in title
  partialTokenIssuerFactor: number; // fraction of issuerWeight for prefix
  partialTokenOwnerFactor: number; // fraction of ownerWeight for prefix
  partialTokenDescriptionBoost: number; // fixed small boost
}

export const defaultSearchWeights: SearchWeightConfig = {
  issuerWeight: 18,
  ownerNameWeight: 22,
  partialTokenTitleBoost: 20,
  partialTokenIssuerFactor: 0.6,
  partialTokenOwnerFactor: 0.7,
  partialTokenDescriptionBoost: 4
};

/**
 * Compute ranking score for a search term against an achievement-like object.
 * Scoring components:
 *  - Title exact match: +80
 *  - Title contains term: +50
 *  - Description contains: +10
 *  - Issuer contains: +18 (slight nerf)
 *  - Owner name contains: +22 (slight nerf to balance)
 *  - Token phrase full match bonus: +15 (+10 contiguous)
 *  - Word boundary precision (title +8, owner +5)
 *  - Short exact title length boost up to +5 (<=15 chars)
 *  - Freshness: exponential decay 30 * exp(-ageDays/14) (cap 30)
 *  - Diversity penalty (future): duplicate normalized title within window -10 (not implemented here)
 */
export function computeSearchScore(a: SearchAchievementLike, term: string, now: number = Date.now(), weights: SearchWeightConfig = defaultSearchWeights): number {
  if (!term) return 0;
  const t = term.toLowerCase().trim();
  const tokens = t.split(/\s+/).filter(Boolean);
  let score = 0;
  const title = a.title?.toLowerCase() || '';
  const description = (a.description || '').toLowerCase();
  const issuer = (a.issuer || '').toLowerCase();
  const owner = (a.ownerName || '').toLowerCase();

  // Base title match
  if (title === t) score += 80; else if (title.includes(t)) score += 50;

  // Field contains boosts
  if (description.includes(t)) score += 10;
  if (issuer.includes(t)) score += weights.issuerWeight;
  if (owner.includes(t)) score += weights.ownerNameWeight;

  // Token-level semantic weighting
  if (tokens.length > 1) {
    // Phrase / contiguous token sequence in title
    if (tokens.every(tok => title.includes(tok))) {
      // All tokens appear somewhere in title
      score += 15;
      const phrase = tokens.join(' ');
      if (title.includes(phrase)) score += 10; // contiguous phrase bonus
    }
  }

  // Word boundary precision boosts (avoid partial inside longer words)
  const boundaryRegex = new RegExp(`\\b${escapeRegex(t)}\\b`, 'i');
  if (boundaryRegex.test(title)) score += 8;
  if (boundaryRegex.test(owner)) score += 5;

  // Field length normalization (short titles with exact token match get slight boost)
  if (tokens.length === 1 && title === t) {
    const len = title.length;
    if (len <= 15) score += 5;
  }

  // Partial token prefix boosting (multi-token, word boundary oriented)
  if (tokens.length >= 1) {
    const tokenizeWords = (s: string) => s.split(/[\s.,;:()\-_/]+/).filter(Boolean);
    const titleWords = tokenizeWords(title);
    const issuerWords = tokenizeWords(issuer);
    const ownerWords = tokenizeWords(owner);
    const descWords = description ? tokenizeWords(description) : [];
    for (const tok of tokens) {
      if (!tok) continue;
      const lowerTok = tok.toLowerCase();
      // Title prefix matches
      if (titleWords.some(w => w.startsWith(lowerTok))) {
        score += weights.partialTokenTitleBoost;
      }
      if (issuerWords.some(w => w.startsWith(lowerTok))) {
        score += weights.issuerWeight * weights.partialTokenIssuerFactor;
      }
      if (ownerWords.some(w => w.startsWith(lowerTok))) {
        score += weights.ownerNameWeight * weights.partialTokenOwnerFactor;
      }
      if (descWords.length && descWords.some(w => w.startsWith(lowerTok))) {
        score += weights.partialTokenDescriptionBoost;
      }
    }
  }

  // Recency boost
  if (a.createdAt) {
    const ageDays = (now - a.createdAt) / 86400000;
    const freshness = 30 * Math.exp(-ageDays / 14);
    score += freshness;
  }
  return score;
}

function escapeRegex(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, r => `\\${r}`); }
