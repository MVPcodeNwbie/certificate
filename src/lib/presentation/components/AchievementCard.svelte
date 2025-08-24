<script lang="ts">
	export let title: string;
	export let ownerName: string;
	export let ownerRole: string;
	export let issuer: string | undefined;
	export let date: string | undefined;
	export let type: string;
	export let fileUrl: string | undefined; // legacy single
	export let evidence: { url: string; mimeType?: string; path?: string; name?: string; blurDataUrl?: string; isThumbnail?: boolean; }[] | undefined;
	export let url: string | undefined;

	const typeEmoji: Record<string, string> = {
		certificate: '📜',
		diploma: '🎓',
		award: '🏆',
		competition: '🏃‍♂️',
		training: '📚',
		other: '✨'
	};

	const roleEmoji: Record<string, string> = {
		admin: '👨‍💼',
		teacher: '👨‍🏫',
		student: '👨‍🎓'
	};

	const typeLabel: Record<string, string> = {
		certificate: 'เกียรติบัตร',
		diploma: 'วุฒิบัตร',
		award: 'รางวัล',
		competition: 'การแข่งขัน',
		training: 'การอบรม',
		other: 'อื่น ๆ'
	};

	const roleLabel: Record<string, string> = {
		admin: 'ผู้บริหาร',
		teacher: 'ครู',
		student: 'นักเรียน'
	};

	import Badge from '$lib/presentation/components/Badge.svelte';

	// derive thumbnail evidence reactively
	$: thumbEvidence = (evidence && evidence.length) ? (evidence.find(e => (e as any).isThumbnail) || evidence[0]) : undefined;
	let loaded = false;
	let inView = false;
	let imgEl: HTMLImageElement;
	function onImgLoad(){ loaded = true; }
	function observe(node: HTMLElement) {
		if ('IntersectionObserver' in window) {
			const io = new IntersectionObserver(entries => {
				entries.forEach(e => { if (e.isIntersecting) { inView = true; io.disconnect(); } });
			});
			io.observe(node);
		} else { inView = true; }
	}
</script>

<article class="card hover:shadow-lg transition-shadow duration-200">
	<div class="p-6">
		<div class="flex items-start justify-between mb-4">
			<div class="flex-1">
				<div class="flex items-center gap-2 mb-2">
					<span class="text-2xl">{typeEmoji[type] || '✨'}</span>
					<Badge color="brand" size="sm">{typeLabel[type] || type}</Badge>
				</div>
				<h3 class="text-xl font-semibold text-gray-900 mb-2 leading-tight">{title}</h3>
				<div class="flex items-center gap-4 text-sm text-gray-600">
					<div class="flex items-center gap-1">
						<span>{roleEmoji[ownerRole] || '👤'}</span>
						<span>{roleLabel[ownerRole] || ownerRole}</span>
					</div>
					<div class="flex items-center gap-1">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
						</svg>
						<span class="font-medium">{ownerName}</span>
					</div>
				</div>
			</div>
		</div>

		{#if (evidence && evidence.length) || fileUrl}
			<div class="mb-4">
					{#if evidence && evidence.length}
						{#key evidence}
						{#if thumbEvidence && thumbEvidence.url.endsWith('.pdf')}
							<a 
								href={thumbEvidence.url} 
								target="_blank" 
								rel="noreferrer" 
								class="inline-flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors duration-200 text-sm font-medium"
							>
								<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
								</svg>
								เปิดไฟล์ PDF
							</a>
						{:else}
							<div class="rounded-lg overflow-hidden bg-gray-100">
									{#if thumbEvidence}
									<div class="relative w-full h-48 overflow-hidden" use:observe>
										{#if thumbEvidence.blurDataUrl && !loaded}
											<img src={thumbEvidence.blurDataUrl} alt={title} class="absolute inset-0 w-full h-full object-cover filter blur-md scale-110" />
										{/if}
										<img 
											bind:this={imgEl}
											src={inView ? thumbEvidence.url : (thumbEvidence.blurDataUrl || thumbEvidence.url)} 
											alt={title} 
											loading="lazy" 
											on:load={onImgLoad}
											class="w-full h-full object-cover hover:scale-105 transition-transform duration-200 {thumbEvidence.blurDataUrl && (!loaded) ? 'opacity-0' : 'opacity-100'}" 
										/>
									</div>
								{/if}
							</div>
						{/if}
						{/key}
					{:else if fileUrl}
						{#if fileUrl.endsWith('.pdf')}
					<a 
						href={fileUrl} 
						target="_blank" 
						rel="noreferrer" 
						class="inline-flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors duration-200 text-sm font-medium"
					>
						<svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
						</svg>
						เปิดไฟล์ PDF
					</a>
				{:else}
						<div class="rounded-lg overflow-hidden bg-gray-100">
							<img 
								src={fileUrl} 
								alt={title} 
								loading="lazy" 
								class="w-full h-48 object-cover hover:scale-105 transition-transform duration-200"
							/>
						</div>
					{/if}
				{/if}
			</div>
		{/if}

		<div class="border-t border-gray-200 pt-4">
			<dl class="space-y-2">
				{#if issuer}
					<div class="flex items-center gap-2 text-sm">
						<dt class="text-gray-500 min-w-[60px]">ผู้ออก:</dt>
						<dd class="text-gray-900 font-medium">{issuer}</dd>
					</div>
				{/if}
				{#if date}
					<div class="flex items-center gap-2 text-sm">
						<dt class="text-gray-500 min-w-[60px]">วันที่:</dt>
						<dd class="text-gray-900">{new Date(date).toLocaleDateString('th-TH', { 
							year: 'numeric', 
							month: 'long', 
							day: 'numeric' 
						})}</dd>
					</div>
				{/if}
				{#if url}
					<div class="flex items-center gap-2 text-sm">
						<dt class="text-gray-500 min-w-[60px]">ลิงก์:</dt>
						<dd>
							<a 
								href={url} 
								target="_blank" 
								rel="noreferrer"
								class="text-green-600 hover:text-green-700 underline break-all"
							>
								{url.length > 50 ? url.substring(0, 50) + '...' : url}
							</a>
						</dd>
					</div>
				{/if}
			</dl>
		</div>
	</div>
</article>
