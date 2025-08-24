import { on } from '$lib/domain/events/event-bus';
import { ACHIEVEMENT_CREATED, ACHIEVEMENT_UPDATED, ACHIEVEMENT_DELETED, ACHIEVEMENT_EVIDENCE_DELETED } from '$lib/domain/events/achievement-events';
import { publishAudit } from '$lib/infrastructure/audit/audit-log';

function publish(eventType: string, refId: string) {
  publishAudit({ eventType: eventType as any, refId, client: { ua: navigator?.userAgent } });
}

on(ACHIEVEMENT_CREATED, (e: any) => publish('achievement.create', e.id));
on(ACHIEVEMENT_UPDATED, (e: any) => publish('achievement.update', e.id));
on(ACHIEVEMENT_DELETED, (e: any) => publish('achievement.delete', e.id));
on(ACHIEVEMENT_EVIDENCE_DELETED, (e: any) => publish('achievement.deleteEvidence', e.id));
