<script lang="ts">
	import Button from '$lib/presentation/components/Button.svelte';
	import { onMount } from 'svelte';
	import { AchievementFirebaseRepository } from '$lib/infrastructure/repositories/achievement-firebase-repo';
	import { GetAchievementById, UpdateAchievement, DeleteAchievement, DeleteEvidenceFile } from '$lib/application/usecases';
	import AchievementCard from '$lib/presentation/components/AchievementCard.svelte';
	import EvidenceGallery from '$lib/presentation/components/EvidenceGallery.svelte';
	import { page } from '$app/stores';
	import ConfirmDialog from '$lib/presentation/components/modals/ConfirmDialog.svelte';
	import ImageWithFallback from '$lib/components/ImageWithFallback.svelte';
	import { warmImages } from '$lib/utils/imageLoader';
		// Removed params export (unused) to prevent warnings
	// Re-added: runtime still passes 'params'
	export let params: Record<string,string> | undefined; void params;

	let a: any = null;
	let loading = true;
	const repo = new AchievementFirebaseRepository();
	const getUseCase = new GetAchievementById(repo);
	const updateUseCase = new UpdateAchievement(repo);
	const deleteUseCase = new DeleteAchievement(repo);
	const deleteEvidenceUseCase = new DeleteEvidenceFile(repo);

	let editing = false;
	let editTitle = '';
	let editDescription = '';
	let saving = false;
	let deleting = false;
	let confirmDelete = false;
	let errorMsg = '';
	let deletingEvidencePath: string | null = null;
	let evidenceDeleting = false;

	// Track failed images (if any) to show summary/message
	let imageErrors: Set<string> = new Set();

	onMount(async () => {
		const id = $page.params.id;
		if (id) {
			a = await getUseCase.exec(id);
			if (a) {
				editTitle = a.title;
				editDescription = a.description || '';
				if (a.evidenceUrls && a.evidenceUrls.length) {
					// Begin preloading evidence images (non-blocking)
					warmImages(a.evidenceUrls);
				}
			}
		}
		loading = false;
	});

	function handleImageError(event: CustomEvent<{ src: string }> | any) {
		if (event?.detail?.src) {
		imageErrors.add(event.detail.src);
		imageErrors = imageErrors; // trigger reactivity
		}
	}

	async function saveChanges() {
		if (!a) return;
		if (!editTitle.trim()) { errorMsg = 'กรุณากรอกชื่อ'; return; }
		saving = true; errorMsg='';
		try {
			await updateUseCase.exec(a.id, { title: editTitle, description: editDescription });
			a = await getUseCase.exec(a.id);
			editing = false;
		} catch (e:any) {
			errorMsg = 'บันทึกไม่สำเร็จ';
		} finally { saving = false; }
	}

	async function deleteItem() {
		if (!a) return;
		deleting = true; errorMsg='';
		try {
			await deleteUseCase.exec(a.id);
			// Invalidate cached first page so list refreshes (prevents showing deleted card)
			try { sessionStorage.removeItem('achievements:firstPage'); } catch {}
			window.location.href = '/achievements';
		} catch { errorMsg = 'ลบไม่สำเร็จ'; } finally { deleting = false; confirmDelete=false; }
	}

	async function deleteEvidence(path: string) {
		if (!a || evidenceDeleting) return;
		if (!confirm('ยืนยันลบไฟล์นี้?')) return;
		evidenceDeleting = true;
		try {
			await deleteEvidenceUseCase.exec(a.id, path);
			a = await getUseCase.exec(a.id);
		} catch (e) {
			alert('ลบไฟล์ไม่สำเร็จ');
		} finally { evidenceDeleting = false; }
	}
</script>

<svelte:head>
	{#if a}
		<title>{a.title} - ผลงานและรางวัล</title>
		<meta name="description" content={a.description || a.title}>
		<meta property="og:title" content={a.title}>
		<meta property="og:description" content={a.description || a.title}>
		{#if a.fileUrl}<meta property="og:image" content={a.fileUrl}>{/if}
		<meta property="og:type" content="article">
		<meta property="twitter:card" content="summary_large_image">
	{/if}
</svelte:head>

{#if loading}
	<div class="text-center py-12">
		<svg class="animate-spin h-12 w-12 mx-auto text-green-600" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
		</svg>
		<p class="text-gray-600 mt-4">กำลังโหลดข้อมูล...</p>
	</div>
{:else if !a}
	<div class="text-center py-12">
		<svg class="h-24 w-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
		</svg>
		<h3 class="text-lg font-medium text-gray-900 mt-4">ไม่พบข้อมูล</h3>
		<p class="text-gray-600 mt-2">ไม่พบผลงานที่ค้นหา อาจถูกลบหรือไม่มีอยู่จริง</p>
		<div class="mt-6 space-x-4">
			<Button href="/achievements" variant="primary" size="md">
				กลับสู่รายการทั้งหมด
			</Button>
		</div>
	</div>
{:else}
	<div class="space-y-6">
		<!-- Navigation -->
		<nav class="flex items-center space-x-2 text-sm text-gray-500">
			<a href="/" class="hover:text-green-600">หน้าแรก</a>
			<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
			</svg>
			<a href="/achievements" class="hover:text-green-600">รายการผลงาน</a>
			<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
			</svg>
			<span class="text-gray-900 font-medium">รายละเอียด</span>
		</nav>

		<!-- Header -->
		<div class="text-center">
			<h1 class="text-3xl font-bold text-gray-900">รายละเอียดผลงาน</h1>
			<p class="text-gray-600 mt-2">ข้อมูลครบถ้วนของผลงานและรางวัล</p>
		</div>

		<!-- Achievement Detail Card / Edit Form -->
		<div class="max-w-5xl mx-auto space-y-6">
			{#if editing}
				<div class="card p-6 space-y-4">
					<h2 class="text-xl font-semibold">แก้ไขผลงาน</h2>
					{#if errorMsg}<p class="text-red-600 text-sm">{errorMsg}</p>{/if}
					<div>
						<label class="form-label" for="edit-title">ชื่อเรื่อง</label>
						<input id="edit-title" class="form-input" bind:value={editTitle} />
					</div>
					<div>
						<label class="form-label" for="edit-description">รายละเอียด</label>
						<textarea id="edit-description" class="form-textarea" rows="4" bind:value={editDescription}></textarea>
					</div>
					<div class="flex gap-3">
						<Button variant="primary" on:click={saveChanges} loading={saving} disabled={saving}>บันทึก</Button>
						<Button variant="secondary" on:click={() => { editing=false; errorMsg=''; editTitle=a.title; editDescription=a.description||''; }} disabled={saving}>ยกเลิก</Button>
					</div>
				</div>
			{:else}
				<AchievementCard {...a} />
				{#if a.evidence && a.evidence.length > 1}
					<div class="mt-6">
						<EvidenceGallery evidence={a.evidence} enableDelete on:delete={(e) => deleteEvidence(e.detail.path)} />
						{#if evidenceDeleting}
							<p class="text-sm text-gray-500 mt-2">กำลังลบไฟล์...</p>
						{/if}
					</div>
				{:else if a.evidence && a.evidence.length === 1}
					<div class="mt-4 flex gap-3">
						<Button href={a.evidence[0].url} target="_blank" rel="noopener" variant="secondary" size="sm">เปิดไฟล์</Button>
						<Button type="button" variant="secondary" size="sm" on:click={() => { const d=document.createElement('a'); d.href=a.evidence[0].url; d.download=a.evidence[0].name||'evidence'; document.body.appendChild(d); d.click(); d.remove(); }}>ดาวน์โหลด</Button>
					</div>
				{/if}
				{#if a.evidenceUrls && a.evidenceUrls.length > 0}
					<div class="mt-8">
						<h2 class="text-xl font-semibold mb-4">หลักฐาน</h2>
						{#if imageErrors.size > 0}
							<p class="text-sm text-amber-600 mb-2">พบรูปภาพ {imageErrors.size} รายการที่โหลดไม่สำเร็จ</p>
						{/if}
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{#each a.evidenceUrls as url}
									<div class="relative group h-48 rounded-lg overflow-hidden">
										<ImageWithFallback
												src={url}
												alt="หลักฐาน"
												className="w-full h-48"
												loading="lazy"
												preload
												on:error={handleImageError}
										/>
										{#if !imageErrors.has(url)}
											<a
												href={url}
												target="_blank"
												rel="noopener noreferrer"
												class="absolute inset-0 bg-black/0 hover:bg-black/50 transition-colors duration-200 flex items-center justify-center"
											>
												<span class="text-white opacity-0 group-hover:opacity-100 transition-opacity">ดูภาพเต็ม</span>
											</a>
										{/if}
									</div>
								{/each}
						</div>
					</div>
				{/if}
			{/if}
		</div>

		<!-- Actions -->
		<div class="flex justify-center flex-wrap gap-4 pt-6">
				<Button href="/achievements" variant="secondary">
				<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
				</svg>
				กลับสู่รายการ
				</Button>
				<Button href="/submit" variant="primary">
				<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
				</svg>
				เพิ่มผลงานใหม่
				</Button>
			{#if a}
				<Button variant="secondary" on:click={() => { editing = true; }}>แก้ไข</Button>
				<Button variant="danger" disabled={deleting} on:click={() => { confirmDelete = true; }}>ลบ</Button>
				<Button variant="secondary" on:click={() => { try { navigator.clipboard.writeText(window.location.href); alert('คัดลอกลิงก์แล้ว'); } catch {} }}>แชร์</Button>
			{/if}
		</div>

		<ConfirmDialog
			open={confirmDelete}
			title="ยืนยันการลบ"
			message="คุณต้องการลบผลงานนี้หรือไม่? การลบไม่สามารถย้อนกลับได้"
			confirmText={deleting ? 'กำลังลบ...' : 'ลบ'}
			loading={deleting}
			onConfirm={deleteItem}
			onCancel={() => { if(!deleting) confirmDelete=false; }}
		/>
	</div>
{/if}
