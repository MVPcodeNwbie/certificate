import type { Achievement } from './achievement';

export interface AchievementRepository {
	create(input: Achievement, file?: File | File[], onProgress?: (p: number) => void): Promise<string>; // returns new id
	list(limit?: number): Promise<Achievement[]>;
	/** List a page of achievements ordered by createdAt desc. Pass afterCreatedAt (previous last item's createdAt) to get next page. */
	listPage(limit: number, afterCreatedAt?: number): Promise<Achievement[]>;
	/** List page with simple equality filters (ownerRole/type). Search term still client-side. */
	listFilteredPage(limit: number, afterCreatedAt: number | undefined, filters: { ownerRole?: string; type?: string }): Promise<Achievement[]>;
	/** Search using searchMetadata (prefix on fullText) with optional facets.
	 *  Pagination:
	 *   - When searchTerm provided -> use afterFullText cursor (last returned _searchFullText value)
	 *   - When no searchTerm -> use afterCreatedAt (createdAt numeric)
	 */
	searchPage(limit: number, options: { searchTerm?: string; ownerRole?: string; type?: string; afterCreatedAt?: number; afterFullText?: string }): Promise<Achievement[]>;
	getById(id: string): Promise<Achievement | null>;
	update(id: string, patch: Partial<Achievement>, file?: File | File[], onProgress?: (p: number) => void): Promise<void>;
	delete(id: string): Promise<void>;
	/** Delete a single evidence file by its storage path from an achievement */
	deleteEvidence(id: string, evidencePath: string): Promise<void>;
}
