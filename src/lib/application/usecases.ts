import type { Achievement } from '$lib/domain/achievement';
import type { AchievementRepository } from '$lib/domain/achievement-repository';
import { validateAchievement, DomainValidationError } from '$lib/domain/value-objects';

export class CreateAchievement {
	constructor(private repo: AchievementRepository) {}
	exec(input: Achievement, file?: File | File[], onProgress?: (p: number)=>void) {
		const { ok, errors, value } = validateAchievement(input, { isUpdate: false });
		if (!ok) throw new DomainValidationError(errors);
		return this.repo.create(value as Achievement, file, onProgress);
	}
}

export class ListAchievements {
	constructor(private repo: AchievementRepository) {}
	exec(limit?: number) {
		return this.repo.list(limit);
	}
}

export class ListAchievementsPage {
	constructor(private repo: AchievementRepository) {}
	exec(limit: number, afterCreatedAt?: number) {
		return this.repo.listPage(limit, afterCreatedAt);
	}
}

export class ListAchievementsFilteredPage {
	constructor(private repo: AchievementRepository) {}
	exec(limit: number, afterCreatedAt: number | undefined, filters: { ownerRole?: string; type?: string }) {
		return this.repo.listFilteredPage(limit, afterCreatedAt, filters);
	}
}

export class SearchAchievementsPage {
	constructor(private repo: AchievementRepository) {}
	exec(limit: number, options: { searchTerm?: string; ownerRole?: string; type?: string; afterCreatedAt?: number; afterFullText?: string }) {
		return this.repo.searchPage(limit, options);
	}
}

export class GetAchievementById {
	constructor(private repo: AchievementRepository) {}
	exec(id: string) {
		return this.repo.getById(id);
	}
}

export class UpdateAchievement {
	constructor(private repo: AchievementRepository) {}
	exec(id: string, patch: Partial<Achievement>, file?: File | File[], onProgress?: (p: number)=>void) {
		const { ok, errors, value } = validateAchievement(patch as any, { isUpdate: true });
		if (!ok) throw new DomainValidationError(errors);
		return this.repo.update(id, value as Partial<Achievement>, file, onProgress);
	}
}

export class DeleteAchievement {
	constructor(private repo: AchievementRepository) {}
	exec(id: string) {
		return this.repo.delete(id);
	}
}

export class DeleteEvidenceFile {
	constructor(private repo: AchievementRepository) {}
	exec(achievementId: string, evidencePath: string) {
		return this.repo.deleteEvidence(achievementId, evidencePath);
	}
}
