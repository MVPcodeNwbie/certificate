export interface FilterCriteria {
  ownerRole?: string;
  type?: string;
  academicYear?: number;
  orgLevel?: string;
}

export interface PaginationState {
  afterCreatedAt?: number;
  afterFullText?: string;
}

export interface QueryOptions extends FilterCriteria, PaginationState {
  searchTerm?: string;
  limit: number;
  weightsVersion?: number; // bump to invalidate cache when weights change
}

export function buildQueryOptions(base: Partial<QueryOptions>): QueryOptions {
  return {
    limit: base.limit ?? 30,
    searchTerm: base.searchTerm?.trim() || undefined,
    ownerRole: base.ownerRole || undefined,
    type: base.type || undefined,
    academicYear: base.academicYear,
  orgLevel: base.orgLevel,
    afterCreatedAt: base.afterCreatedAt,
  afterFullText: base.afterFullText,
  weightsVersion: base.weightsVersion
  };
}

export function canUseCreatedAtCursor(q: QueryOptions) {
  return !q.searchTerm; // createdAt cursor only valid without full-text search
}

export function nextPageCursor(last: any, q: QueryOptions): PaginationState {
  if (!last) return {};
  if (q.searchTerm) return { afterFullText: last._searchFullText };
  return { afterCreatedAt: last.createdAt };
}

// Encapsulated filter specification pattern
export class FilterSpec {
  private criteria: FilterCriteria = {};
  private searchTerm?: string;
  private limit = 30;
  private pagination: PaginationState = {};
  private weightsVersion?: number;

  static create() { return new FilterSpec(); }
  withSearch(term: string | undefined) { this.searchTerm = term?.trim() || undefined; return this; }
  withOwnerRole(role: string | undefined) { this.criteria.ownerRole = role || undefined; return this; }
  withType(t: string | undefined) { this.criteria.type = t || undefined; return this; }
  withAcademicYear(y: number | undefined) { this.criteria.academicYear = y; return this; }
  withOrgLevel(l: string | undefined) { this.criteria.orgLevel = l; return this; }
  withLimit(l: number) { this.limit = l; return this; }
  withPagination(p: PaginationState) { this.pagination = { ...p }; return this; }
  withWeightsVersion(v: number | undefined) { this.weightsVersion = v; return this; }
  build(): QueryOptions { return buildQueryOptions({ ...this.criteria, searchTerm: this.searchTerm, limit: this.limit, ...this.pagination, weightsVersion: this.weightsVersion }); }
}
