import type { AchievementRepository } from '$lib/domain/achievement-repository';
import type { Achievement, FileEvidence } from '$lib/domain/achievement';
import { db, storage } from '$lib/infrastructure/firebase/client';
import { AcademicYear } from '$lib/domain/value-objects';
// Audit is now handled via event projection listener; repository emits only domain events.
import { emit } from '$lib/domain/events/event-bus';
import { ACHIEVEMENT_CREATED, ACHIEVEMENT_DELETED, ACHIEVEMENT_EVIDENCE_DELETED, ACHIEVEMENT_UPDATED } from '$lib/domain/events/achievement-events';
import {
	addDoc,
	collection,
	doc,
	getDoc,
	getDocs,
	limit as fbLimit,
	orderBy,
	query,
	serverTimestamp,
	Timestamp
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { generateBlurDataUrl } from '$lib/utils/lqip';
import { startAfter, where } from 'firebase/firestore';
import { computeSearchScore } from '$lib/domain/search/scoring';
import { deriveTagsForAchievement } from '$lib/domain/hall-of-fame/tags';

export class AchievementFirebaseRepository implements AchievementRepository {
	private col = collection(db, 'achievements');
	private searchCol = collection(db, 'searchMetadata');

	/** Remove any undefined (and optionally null) to satisfy security rules expecting absence when not set */
	private pruneUndefined<T extends Record<string, any>>(obj: T, dropNullKeys: string[] = []): T {
		for (const k of Object.keys(obj)) {
			if (obj[k] === undefined) delete (obj as any)[k];
			else if (obj[k] === null && (dropNullKeys.length === 0 || dropNullKeys.includes(k))) delete (obj as any)[k];
		}
		return obj;
	}

	async create(input: Achievement, file?: File | File[], onProgress?: (p: number) => void): Promise<string> {
		const now = Date.now();
		const filesArray = (file ? (Array.isArray(file) ? file : [file]) : []) as File[];
		const total = filesArray.length;
		const evidence: FileEvidence[] = [];
		for (let i = 0; i < filesArray.length; i++) {
			const f = filesArray[i];
			const safeName = `${now}-${i}-${f.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
			const path = `achievements/${safeName}`;
			const storageRef = ref(storage, path);
			await uploadBytes(storageRef, f);
			const url = await getDownloadURL(storageRef);
			const isThumb = /-thumb\.(jpg|jpeg|png|webp)$/i.test(f.name);
			let blurDataUrl: string | undefined;
			if (f.type.startsWith('image/')) {
				try { blurDataUrl = await generateBlurDataUrl(f); } catch {}
			}
			evidence.push({ path, url, mimeType: f.type, name: f.name, size: f.size, ...(isThumb ? { isThumbnail: true } : {}), ...(blurDataUrl ? { blurDataUrl } : {}) });
			if (onProgress) onProgress(Math.round(((i + 1) / total) * 100));
		}
		if (evidence.length && !evidence.some(e => e.isThumbnail)) {
			const firstImg = evidence.find(e => e.mimeType.startsWith('image/'));
			if (firstImg) firstImg.isThumbnail = true;
		}
		const first = evidence[0];
		const academicYear = input.date ? AcademicYear.create(input.date)?.toNumber() : null;
		const normalizedTitle = input.title.trim().toLowerCase().replace(/\s+/g,' ');
		// Derive semantic tags (simple tokenizer)
		let tags: string[] | undefined;
		try { tags = deriveTagsForAchievement({ title: input.title, description: input.description, issuer: input.issuer, ownerName: input.ownerName, type: input.type }); } catch {}
		const payload = this.pruneUndefined({
			...input,
			normalizedTitle,
			// ensure optional text fields are not undefined (use empty string or remove above)
			description: input.description ?? '',
			issuer: input.issuer ?? '',
			url: input.url ?? '',
			filePath: first?.path || input.filePath || '',
			fileUrl: first?.url || input.fileUrl || '',
			evidence: (evidence.length ? evidence : input.evidence) || [],
			academicYear, // Buddhist Era (พ.ศ.) or omit if null
			createdAt: now,
			updatedAt: now,
			tags: tags || [],
			views: 0,
			likes: 0,
			createdAtTs: serverTimestamp()
		}, ['academicYear']);
		// Strictly keep only whitelisted keys per security rules (defensive)
		const allowedKeys = new Set(['title','normalizedTitle','description','issuer','date','ownerRole','ownerName','type','url','filePath','fileUrl','academicYear','createdAt','updatedAt','createdAtTs','evidence','tags','views','likes','orgLevel','orgNames']);
		for (const k of Object.keys(payload)) { if (!allowedKeys.has(k)) delete (payload as any)[k]; }
		// Debug log (remove in production) to inspect payload when permission errors occur
		console.debug('[AchievementRepo.create] payload keys', Object.keys(payload));
		console.debug('[AchievementRepo.create] sample payload', { ...payload, evidence: Array.isArray(payload.evidence) ? `files:${payload.evidence.length}` : payload.evidence });
		let docRef;
		try {
			docRef = await addDoc(this.col, payload as any);
		} catch (err:any) {
			console.error('[AchievementRepo.create] Firestore addDoc error', err?.code, err?.message, err);
			// Cleanup already uploaded files to avoid orphaned objects in Storage
			if (evidence.length) {
				console.warn('[AchievementRepo.create] Rolling back uploaded files due to Firestore failure');
				for (const ev of evidence) {
					try { await deleteObject(ref(storage, ev.path)); } catch (delErr) {
						console.warn('[AchievementRepo.create] Failed to delete orphaned file', ev.path, delErr);
					}
				}
			}
			throw err;
		}
		// Domain Event (audit handled by listener)
		emit(ACHIEVEMENT_CREATED, { id: docRef.id, data: payload, at: now });
		// Create search metadata document for server-side search
		try {
			const year = input.date ? new Date(input.date).getFullYear() : null;
			const aYear = academicYear;
			const fullText = `${input.title} ${input.description || ''} ${input.issuer || ''} ${input.ownerName}`.toLowerCase();
			await import('firebase/firestore').then(({ setDoc, doc: d }) =>
				setDoc(d(this.searchCol, docRef.id), {
					fullText,
					title: input.title.toLowerCase(),
					facets: {
						type: input.type,
						role: input.ownerRole,
						year,
						academicYear: aYear,
						orgLevel: (input as any).orgLevel || null
					},
					createdAt: now
				} as any)
			);
		} catch (e) {
			console.warn('Failed to write searchMetadata', e);
		}
		return docRef.id;
	}

	async list(max = 50): Promise<Achievement[]> {
		const q = query(this.col, orderBy('createdAt', 'desc'), fbLimit(max));
		const snap = await getDocs(q);
		return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
	}

	async listPage(limitNum: number, afterCreatedAt?: number): Promise<Achievement[]> {
		let qBase: any = query(this.col, orderBy('createdAt', 'desc'), fbLimit(limitNum));
		if (afterCreatedAt) {
			qBase = query(this.col, orderBy('createdAt', 'desc'), startAfter(afterCreatedAt), fbLimit(limitNum));
		}
		const snap = await getDocs(qBase);
		return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
	}

	async listFilteredPage(limitNum: number, afterCreatedAt: number | undefined, filters: { ownerRole?: string; type?: string }): Promise<Achievement[]> {
		const constraints: any[] = [];
		if (filters.ownerRole) constraints.push(where('ownerRole', '==', filters.ownerRole));
		if (filters.type) constraints.push(where('type', '==', filters.type));
		constraints.push(orderBy('createdAt', 'desc'));
		constraints.push(fbLimit(limitNum));
		let qBase: any = query(this.col, ...constraints);
		if (afterCreatedAt) {
			// Need orderBy('createdAt') already included above; append startAfter
			qBase = query(this.col, ...constraints.slice(0, -1), startAfter(afterCreatedAt), fbLimit(limitNum));
		}
		const snap = await getDocs(qBase);
		return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
	}

	async searchPage(limitNum: number, options: { searchTerm?: string; ownerRole?: string; type?: string; afterCreatedAt?: number; afterFullText?: string }): Promise<Achievement[]> {
		const { searchTerm, ownerRole, type, afterCreatedAt, afterFullText } = options;
		// If no searchTerm -> fallback to achievements collection pagination by createdAt (faceted)
		if (!searchTerm) {
			const constraints: any[] = [];
			if (ownerRole) constraints.push(where('ownerRole', '==', ownerRole));
			if (type) constraints.push(where('type', '==', type));
			constraints.push(orderBy('createdAt', 'desc'));
			constraints.push(fbLimit(limitNum));
			let qBase: any = query(this.col, ...constraints);
			if (afterCreatedAt) {
				qBase = query(this.col, ...constraints.slice(0, -1), startAfter(afterCreatedAt), fbLimit(limitNum));
			}
			const snap = await getDocs(qBase);
			return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
		}

		// With searchTerm -> use searchMetadata collection for prefix/range query on fullText
		const st = searchTerm.toLowerCase().trim();
		const metaConstraints: any[] = [];
		if (ownerRole) metaConstraints.push(where('facets.role', '==', ownerRole));
		if (type) metaConstraints.push(where('facets.type', '==', type));
		metaConstraints.push(orderBy('fullText'));
		// cursor (afterFullText) implemented via startAfter(fullTextCursor)
		if (afterFullText) {
			metaConstraints.push(startAfter(afterFullText));
		}
		metaConstraints.push(where('fullText', '>=', st));
		metaConstraints.push(where('fullText', '<', st + '\uf8ff'));
		metaConstraints.push(fbLimit(limitNum));
		const metaQuery = query(this.searchCol, ...metaConstraints);
		const metaSnap = await getDocs(metaQuery);
		const ids = metaSnap.docs.map(d => d.id);
		if (!ids.length) return [];
		// Fetch achievements by ids (parallel)
		const achDocs = await Promise.all(ids.map(id => getDoc(doc(this.col, id))));
		// Attach meta for ranking
		const metaMap: Record<string, any> = {};
		metaSnap.docs.forEach(d => { metaMap[d.id] = d.data(); });
		const term = st;
		const now = Date.now();
		const rows: Achievement[] = achDocs.filter(s => s.exists()).map(s => {
			const data: any = s.data();
			const meta = metaMap[s.id];
			const fullText: string = meta.fullText;
			const score = computeSearchScore(data, term, now);
			return { id: s.id, ...data, _searchFullText: fullText, _score: score } as any;
		});
		rows.sort((a: any, b: any) => b._score - a._score || b.createdAt - a.createdAt);
		return rows as any;
	}

	async getById(id: string): Promise<Achievement | null> {
		const snap = await getDoc(doc(this.col, id));
		return snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as Achievement) : null;
	}

	async update(id: string, patch: Partial<Achievement>, file?: File | File[], onProgress?: (p: number) => void): Promise<void> {
		const refDoc = doc(this.col, id);
		const existingSnap = await getDoc(refDoc);
		if (!existingSnap.exists()) throw new Error('Not found');
		let filePath = patch.filePath as string | undefined;
		let fileUrl = patch.fileUrl as string | undefined;
		let evidence = (patch.evidence as FileEvidence[] | undefined) || (existingSnap.data() as any).evidence || [];
		const filesArray = file ? (Array.isArray(file) ? file : [file]) : [];
		if (filesArray.length) {
			const now = Date.now();
			for (let i = 0; i < filesArray.length; i++) {
				const f = filesArray[i];
				const safeName = `${now}-${i}-${f.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
				const path = `achievements/${safeName}`;
				const storageRef = ref(storage, path);
				await uploadBytes(storageRef, f);
				const url = await getDownloadURL(storageRef);
				evidence.push({ path, url, mimeType: f.type, name: f.name, size: f.size });
				if (onProgress) onProgress(Math.round(((i + 1) / filesArray.length) * 100));
			}
			const first = evidence[0];
			if (first && !first.isThumbnail && first.mimeType.startsWith('image/')) first.isThumbnail = true;
			filePath = first?.path;
			fileUrl = first?.url;
		}
		const existingData: any = existingSnap.data();
		const academicYear = (patch.date ? AcademicYear.create(patch.date) : existingData.date ? AcademicYear.create(existingData.date) : null)?.toNumber() || null;
		await import('firebase/firestore').then(({ updateDoc }) =>
			updateDoc(refDoc, this.pruneUndefined({
				...patch,
				// normalise optional fields
				description: patch.description ?? existingData.description ?? '',
				issuer: patch.issuer ?? existingData.issuer ?? '',
				url: patch.url ?? existingData.url ?? '',
				filePath: filePath || '',
				fileUrl: fileUrl || '',
				evidence,
				academicYear, // drop if null
				updatedAt: Date.now()
			} as any, ['academicYear']))
		);
		emit(ACHIEVEMENT_UPDATED, { id, patch, at: Date.now() });
		// Update search metadata (merge existing + patch to compute)
		try {
			const finalTitle = (patch.title ?? existingData.title) as string;
			const finalDescription = (patch.description ?? existingData.description) as string | undefined;
			const finalIssuer = (patch.issuer ?? existingData.issuer) as string | undefined;
			const finalOwnerName = (patch.ownerName ?? existingData.ownerName) as string;
			const finalType = (patch.type ?? existingData.type) as string;
			const finalRole = (patch.ownerRole ?? existingData.ownerRole) as string;
			const finalDate = (patch.date ?? existingData.date) as string | undefined;
			const year = finalDate ? new Date(finalDate).getFullYear() : null;
			const academicYear = finalDate ? AcademicYear.create(finalDate)?.toNumber() : (existingData.academicYear ?? null);
			const fullText = `${finalTitle} ${finalDescription || ''} ${finalIssuer || ''} ${finalOwnerName}`.toLowerCase();
			await import('firebase/firestore').then(({ setDoc, doc: d }) =>
				setDoc(d(this.searchCol, id), {
					fullText,
					title: finalTitle.toLowerCase(),
					facets: { type: finalType, role: finalRole, year, academicYear, orgLevel: (patch as any).orgLevel ?? existingData.orgLevel ?? null },
					updatedAt: Date.now()
				}, { merge: true } as any)
			);
		} catch (e) {
			console.warn('Failed to update searchMetadata', e);
		}
	}

	async delete(id: string): Promise<void> {
		const refDoc = doc(this.col, id);
		const existingSnap = await getDoc(refDoc);
		if (!existingSnap.exists()) return;
		const data: any = existingSnap.data();
		if (data.filePath) {
			try { await deleteObject(ref(storage, data.filePath)); } catch {}
		}
		await import('firebase/firestore').then(({ deleteDoc, doc: d }) => Promise.all([
			deleteDoc(refDoc),
			deleteDoc(d(this.searchCol, id)).catch(() => {})
		]));
		emit(ACHIEVEMENT_DELETED, { id, before: data, at: Date.now() });
	}

	async deleteEvidence(id: string, evidencePath: string): Promise<void> {
		const refDoc = doc(this.col, id);
		const snap = await getDoc(refDoc);
		if (!snap.exists()) throw new Error('Not found');
		const data: any = snap.data();
		const evidence: FileEvidence[] = (data.evidence || []).filter((e: FileEvidence) => e.path !== evidencePath);
		// delete file from storage
		try { await deleteObject(ref(storage, evidencePath)); } catch {}
		// adjust legacy first file mapping
		const first = evidence[0];
		await import('firebase/firestore').then(({ updateDoc }) => updateDoc(refDoc, {
			evidence,
			filePath: first?.path || null,
			fileUrl: first?.url || null,
			updatedAt: Date.now()
		} as any));
		emit(ACHIEVEMENT_EVIDENCE_DELETED, { id, evidencePath, at: Date.now() });
	}
}
