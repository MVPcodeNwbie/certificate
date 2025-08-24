import type { FileEvidence } from '$lib/domain/achievement';

/**
 * Filter out thumbnail images when there is at least one non-thumbnail image.
 * If only thumbnails exist, keep the first (so user still sees an image).
 */
export function filterEvidence(evidence: FileEvidence[]): FileEvidence[] {
  if (!Array.isArray(evidence) || !evidence.length) return [];
  const images = evidence.filter(e => e.mimeType?.startsWith('image/'));
  const hasNonThumb = images.some(e => !e.isThumbnail);
  if (!hasNonThumb) return evidence; // show all (or only) entries if no non-thumb image
  return evidence.filter(e => !(e.isThumbnail && e.mimeType?.startsWith('image/')));
}
