import { db } from '$lib/infrastructure/firebase/client';
import { collection, doc, getDoc, getDocs, orderBy, query, where, limit as fbLimit, startAfter } from 'firebase/firestore';
import { computeSearchScore, defaultSearchWeights, type SearchWeightConfig } from '$lib/domain/search/scoring';

export interface SearchOptions {
  searchTerm?: string;
  ownerRole?: string;
  type?: string;
  orgLevel?: string;
  afterCreatedAt?: number;
  afterFullText?: string;
  limit?: number;
  weights?: SearchWeightConfig;
}

export class SearchService {
  private achCol = collection(db, 'achievements');
  private metaCol = collection(db, 'searchMetadata');

  async search(opts: SearchOptions) {
    const { searchTerm, ownerRole, type, orgLevel, afterCreatedAt, afterFullText, limit = 50, weights = defaultSearchWeights } = opts;
    if (!searchTerm) {
      const constraints: any[] = [];
      if (ownerRole) constraints.push(where('ownerRole', '==', ownerRole));
      if (type) constraints.push(where('type', '==', type));
      if (orgLevel) constraints.push(where('orgLevel', '==', orgLevel));
      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(fbLimit(limit));
      let qBase: any = query(this.achCol, ...constraints);
      if (afterCreatedAt) qBase = query(this.achCol, ...constraints.slice(0, -1), startAfter(afterCreatedAt), fbLimit(limit));
      const snap = await getDocs(qBase);
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    }
    const st = searchTerm.toLowerCase().trim();
    const metaConstraints: any[] = [];
  if (ownerRole) metaConstraints.push(where('facets.role', '==', ownerRole));
  if (type) metaConstraints.push(where('facets.type', '==', type));
  if (orgLevel) metaConstraints.push(where('facets.orgLevel', '==', orgLevel));
    metaConstraints.push(orderBy('fullText'));
    if (afterFullText) metaConstraints.push(startAfter(afterFullText));
    metaConstraints.push(where('fullText', '>=', st));
    metaConstraints.push(where('fullText', '<', st + '\uf8ff'));
    metaConstraints.push(fbLimit(limit));
    const metaQuery = query(this.metaCol, ...metaConstraints);
    const metaSnap = await getDocs(metaQuery);
    const ids = metaSnap.docs.map(d => d.id);
    if (!ids.length) return [];
    const achDocs = await Promise.all(ids.map(id => getDoc(doc(this.achCol, id))));
    const metaMap: Record<string, any> = {};
    metaSnap.docs.forEach(d => { metaMap[d.id] = d.data(); });
    const now = Date.now();
    const rows = achDocs.filter(s => s.exists()).map(s => {
      const data: any = s.data();
  const score = computeSearchScore(data, st, now, weights);
      return { id: s.id, ...data, _score: score } as any;
    });
    rows.sort((a: any, b: any) => b._score - a._score || b.createdAt - a.createdAt);
    return rows;
  }
}

export const searchService = new SearchService();
