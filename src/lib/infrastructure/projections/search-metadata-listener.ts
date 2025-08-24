import { on } from '$lib/domain/events/event-bus';
import { ACHIEVEMENT_CREATED, ACHIEVEMENT_UPDATED } from '$lib/domain/events/achievement-events';
import { AcademicYear } from '$lib/domain/value-objects';
import { db } from '$lib/infrastructure/firebase/client';
import { collection, doc, setDoc } from 'firebase/firestore';

// Lazy collection ref
const col = collection(db, 'searchMetadata');

on(ACHIEVEMENT_CREATED, async (e: any) => {
  const { id, data } = e;
  try {
    const year = data.date ? new Date(data.date).getFullYear() : null;
    const academicYear = data.date ? AcademicYear.create(data.date)?.toNumber() : data.academicYear ?? null;
    const fullText = `${data.title} ${data.description || ''} ${data.issuer || ''} ${data.ownerName}`.toLowerCase();
    await setDoc(doc(col, id), {
      fullText,
      title: data.title.toLowerCase(),
      facets: { type: data.type, role: data.ownerRole, year, academicYear },
      createdAt: data.createdAt
    } as any);
  } catch (err) {
    console.warn('[search-metadata-listener] create failed', err);
  }
});

on(ACHIEVEMENT_UPDATED, async (e: any) => {
  const { id, patch } = e;
  try {
    // Minimal merge: fetch doc? For now rely on patch containing changed fields; caller sends only patch.
    // In a richer model we would fetch current state; skipping for lightweight client projection.
    if (!patch.title && !patch.description && !patch.issuer && !patch.ownerName && !patch.type && !patch.ownerRole && !patch.date) return;
    const year = patch.date ? new Date(patch.date).getFullYear() : undefined;
    const academicYear = patch.date ? AcademicYear.create(patch.date)?.toNumber() : undefined;
    // Need existing fields to rebuild fullText; fallback to partial concatenation.
    const fullTextParts = [patch.title, patch.description, patch.issuer, patch.ownerName].filter(Boolean).join(' ').toLowerCase();
    if (!fullTextParts) return; // nothing to update
    await setDoc(doc(col, id), {
      ...(fullTextParts ? { fullText: fullTextParts } : {}),
      ...(patch.title ? { title: patch.title.toLowerCase() } : {}),
      ...(patch.type || patch.ownerRole || year || academicYear ? {
        facets: {
          ...(patch.type ? { type: patch.type } : {}),
          ...(patch.ownerRole ? { role: patch.ownerRole } : {}),
          ...(year !== undefined ? { year } : {}),
          ...(academicYear !== undefined ? { academicYear } : {})
        }
      } : {}),
      updatedAt: Date.now()
    } as any, { merge: true });
  } catch (err) {
    console.warn('[search-metadata-listener] update failed', err);
  }
});
