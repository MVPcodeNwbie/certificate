import type { Achievement } from '../achievement';

export interface OwnerAggregate {
  ownerName: string;
  ownerRole: string;
  count: number;
  totalEvidence: number;
  avgDescriptionLength: number;
  latestCreatedAt: number;
}

export interface RankedAchievement extends Achievement {
  hofScore: number;            // 0..100 normalized
  ownerBonus: number;          // normalized owner portion (0..10)
  baseScore: number;           // sum of non-owner components (0..90)
  ownerAggregate: OwnerAggregate;
  explain?: ScoreExplain;      // optional breakdown (each component already normalized)
}

// Org level bonus (encourage higher level recognition without over-weighting media count)
const ORG_LEVEL_POINTS: Record<string, number> = {
  school: 0,
  district: 5,
  province: 10,
  region: 14,
  national: 20
};

// Type weight bonus – differentiate significance of achievement categories
const TYPE_POINTS: Record<string, number> = {
  certificate: 2,   // baseline recognition
  diploma: 6,       // formal completion (higher than certificate)
  award: 20,        // explicit award / prize highest base bonus
  competition: 14,  // competitive event
  training: 4,      // skill development
  other: 0          // neutral until categorized
};

// New normalized component weights (sum of maximums = 100)
// Evidence 10, Description 25, Recency 15, URL 5, Issuer 10, OrgLevel 15, Type 10, Owner 10
const MAX_DESCRIPTION_LEN_FOR_FULL = 440; // length at which description (with supplemental fields) hits full weight (≈ previous 55 cap *8)

interface ComponentScores { evidence: number; description: number; recency: number; url: number; issuer: number; orgLevel: number; type: number; }

function computeBaseComponents(a: Achievement, now: number): ComponentScores {
  const evCount = a.evidence?.length || 0;
  const evidence = evCount > 0 ? 10 : 0;
  // Effective description length includes main description plus structured supplemental fields
  // so that users who fill specific type fields (training benefits, award level, etc.) are rewarded.
  let descLen = 0;
  const add = (s?: string) => { if (s && s.trim().length) descLen += s.trim().length; };
  add(a.description);
  // Training / diploma specifics
  add((a as any).trainingBenefits);
  add((a as any).trainingNextActions);
  // Award / competition specifics
  add((a as any).awardLevel);
  add((a as any).competitionCategory);
  // Other specified
  add((a as any).otherSpecified);
  // Numeric hours: give a small fixed contribution (scaled) if present (encourages completeness without overweighting)
  if ((a as any).trainingHours != null) {
    const h = (a as any).trainingHours;
    if (typeof h === 'number' && h > 0) {
      // contribute proportional to log(hours+1) scaled to ~20 chars max
      descLen += Math.min(20, Math.log(h + 1) * 8);
    }
  }
  const description = Math.min(descLen / MAX_DESCRIPTION_LEN_FOR_FULL, 1) * 25;
  const ageDays = (now - a.createdAt) / 86400000;
  const recencyRatio = Math.max(0, (28 - ageDays / 14) / 28); // 1 when new, 0 when aged out (≈ 392 days)
  const recency = recencyRatio * 15;
  const url = a.url ? 5 : 0;
  const issuer = (a.issuer && a.issuer.length > 5) ? 10 : 0;
  const orgLevel = (a as any).orgLevel ? (ORG_LEVEL_POINTS[(a as any).orgLevel] || 0) / 20 * 15 : 0; // map 0..20 -> 0..15
  const type = a.type ? (TYPE_POINTS[a.type] || 0) / 20 * 10 : 0; // map 0..20 -> 0..10
  return { evidence, description, recency, url, issuer, orgLevel, type };
}

function sumBaseComponents(c: ComponentScores): number {
  return c.evidence + c.description + c.recency + c.url + c.issuer + c.orgLevel + c.type; // 0..90
}

// Owner aggregation bonus: reward consistent contributors.
// Formula: ownerBonus = (count - 1) * 20 + log(totalEvidence + 1)*5 + recencyFactor
export function ownerAggregateBonus(agg: OwnerAggregate, now: number = Date.now()): number {
  const extraCount = Math.max(0, agg.count - 1) * 20;             // grows with more achievements
  const evidenceFactor = Math.log(agg.totalEvidence + 1) * 5;     // diminishing returns
  const ageDays = (now - agg.latestCreatedAt) / 86400000;
  const recencyFactor = Math.max(0, 15 - ageDays / 30);           // slow decay
  const raw = extraCount + evidenceFactor + recencyFactor;        // unbounded-ish
  // Normalize raw to 0..10 with soft cap: raw 50 -> 10, beyond 50 still capped
  return Math.min(raw / 50 * 10, 10);
}

export function rankHallOfFame(all: Achievement[], now: number = Date.now(), opts: { ownerWeight?: number } = {}): RankedAchievement[] {
  // Build owner aggregates
  const ownerMap = new Map<string, OwnerAggregate>();
  for (const a of all) {
    const key = a.ownerRole + '|' + a.ownerName;
    let agg = ownerMap.get(key);
    if (!agg) {
      agg = {
        ownerName: a.ownerName,
        ownerRole: a.ownerRole,
        count: 0,
        totalEvidence: 0,
        avgDescriptionLength: 0,
        latestCreatedAt: 0
      };
      ownerMap.set(key, agg);
    }
    agg.count += 1;
    agg.totalEvidence += a.evidence?.length || 0;
    const descLen = a.description?.length || 0;
    // running average for description length
    agg.avgDescriptionLength = ((agg.avgDescriptionLength * (agg.count - 1)) + descLen) / agg.count;
    if (a.createdAt > agg.latestCreatedAt) agg.latestCreatedAt = a.createdAt;
  }

  const ownerW = opts.ownerWeight ?? 1; // still allow adjusting owner influence (scales its 0..10 band)
  const ranked: RankedAchievement[] = all.map(a => {
    const comps = computeBaseComponents(a, now);
    const baseScore = sumBaseComponents(comps); // 0..90
    const agg = ownerMap.get(a.ownerRole + '|' + a.ownerName)!;
    const ownerBonus = ownerAggregateBonus(agg, now) * ownerW; // 0..10 * weight (weight >1 can exceed design, keep <=1 ideally)
    const hofScore = Math.min(baseScore + ownerBonus, 100);
    return { ...a, baseScore, ownerBonus, hofScore, ownerAggregate: agg } as RankedAchievement;
  });

  ranked.sort((a, b) => b.hofScore - a.hofScore || b.createdAt - a.createdAt);
  return ranked;
}

// Score explanation structure
export interface ScoreExplainComponent { label: string; value: number; }
export interface ScoreExplain { components: ScoreExplainComponent[]; total: number; }

export function explainAchievementScore(a: RankedAchievement, now: number = Date.now(), ownerWeight = 1): ScoreExplain {
  const comps = computeBaseComponents(a, now);
  const comp: ScoreExplainComponent[] = [
    { label: 'evidence', value: +comps.evidence.toFixed(2) as any },
    { label: 'description', value: +comps.description.toFixed(2) as any },
    { label: 'recency', value: +comps.recency.toFixed(2) as any },
    { label: 'url', value: +comps.url.toFixed(2) as any },
    { label: 'issuer', value: +comps.issuer.toFixed(2) as any },
    { label: 'orgLevel', value: +comps.orgLevel.toFixed(2) as any },
    { label: 'type', value: +comps.type.toFixed(2) as any }
  ];
  comp.push({ label: 'ownerBonus(x'+ownerWeight+')', value: +a.ownerBonus.toFixed(2) as any });
  const total = Math.min(100, comp.reduce((s,c)=>s+c.value,0));
  return { components: comp, total };
}
