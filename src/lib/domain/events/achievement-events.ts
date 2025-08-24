import type { Achievement } from '$lib/domain/achievement';

// Event type constants
export const ACHIEVEMENT_CREATED = 'achievement.created';
export const ACHIEVEMENT_UPDATED = 'achievement.updated';
export const ACHIEVEMENT_DELETED = 'achievement.deleted';
export const ACHIEVEMENT_EVIDENCE_DELETED = 'achievement.evidence.deleted';

export interface AchievementCreatedEvent { id: string; data: Achievement; at: number; }
export interface AchievementUpdatedEvent { id: string; patch: Partial<Achievement>; before?: Achievement | null; at: number; }
export interface AchievementDeletedEvent { id: string; before?: Achievement | null; at: number; }
export interface AchievementEvidenceDeletedEvent { id: string; evidencePath: string; at: number; }

export type AchievementDomainEvent =
  | { type: typeof ACHIEVEMENT_CREATED; payload: AchievementCreatedEvent }
  | { type: typeof ACHIEVEMENT_UPDATED; payload: AchievementUpdatedEvent }
  | { type: typeof ACHIEVEMENT_DELETED; payload: AchievementDeletedEvent }
  | { type: typeof ACHIEVEMENT_EVIDENCE_DELETED; payload: AchievementEvidenceDeletedEvent };
