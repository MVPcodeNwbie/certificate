import type { Achievement } from '$lib/domain/achievement';
import { validateAchievement } from '$lib/domain/value-objects';

// Presentation wrapper to keep existing API (returns string[])
export function validate(input: Partial<Achievement>): string[] {
	const { errors } = validateAchievement(input, { isUpdate: false });
	return errors;
}
