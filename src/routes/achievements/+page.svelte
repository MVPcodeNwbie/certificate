<script lang="ts">
import { onMount } from 'svelte';
import Button from '$lib/presentation/components/Button.svelte';
import AchievementCard from '$lib/presentation/components/AchievementCard.svelte';
import { searchService } from '$lib/application/search/search-service';
import { nextPageCursor, FilterSpec } from '$lib/domain/search/filter-spec';
import { searchWeights, resetSearchWeights } from '$lib/application/search/search-weights-store';
import { get } from 'svelte/store';

export let params: Record<string,string> | undefined; void params;

let items: any[] = [];
let loading = true;
let loadingMore = false;
let reachedEnd = false;
const PAGE_SIZE = 30;
let searchTerm = '';
let selectedType = '';
let selectedRole = '';
let selectedOrgLevel = '';
let debounceTimer: any = null;
let abortCtrl: AbortController | null = null;
let lastCursor: { afterCreatedAt?: number; afterFullText?: string } = {};
const CACHE_KEY = 'achievements:firstPage';
const CACHE_TTL_MS = 60_000; // 1 minute

// Advanced tuner
let showAdvanced = false;
let localWeights = get(searchWeights);
searchWeights.subscribe(v => { localWeights = v; });
let weightsVersion = 1;
// percent helpers for prefix factors (range expects number). Keep in sync manually.
let issuerPrefixPct = localWeights.partialTokenIssuerFactor * 100;
let ownerPrefixPct = localWeights.partialTokenOwnerFactor * 100;

onMount(loadFirst);

function makeFilter(limit = PAGE_SIZE) {
	return FilterSpec.create()
		.withLimit(limit)
		.withSearch(searchTerm)
		.withOwnerRole(selectedRole)
		.withType(selectedType)
		.withOrgLevel(selectedOrgLevel)
		.withPagination(lastCursor)
		.withWeightsVersion(weightsVersion)
		.build();
}

async function loadFirst() {
	cancelInFlight();
	loading = true; reachedEnd = false; items = []; lastCursor = {};
	let usedCache = false;
	if (!selectedRole && !selectedType && !selectedOrgLevel && !searchTerm) {
		try {
			const cached = sessionStorage.getItem(CACHE_KEY);
			if (cached) {
				const parsed = JSON.parse(cached);
				if (parsed.ts && (Date.now() - parsed.ts) < CACHE_TTL_MS) {
					items = parsed.items; reachedEnd = parsed.reachedEnd; loading = false; usedCache = true;
				} else {
					sessionStorage.removeItem(CACHE_KEY);
				}
			}
		} catch {}
		if (usedCache) {
			(async () => {
				const qBg = makeFilter();
				const fresh = await searchService.search({ ...qBg, weights: localWeights } as any);
				if (fresh.length !== items.length || fresh.some((f:any,i:number)=>f.id !== items[i]?.id)) {
					items = fresh;
					if (fresh.length < PAGE_SIZE) reachedEnd = true; else reachedEnd = false;
					try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ items, reachedEnd, ts: Date.now() })); } catch {}
				}
			})();
			return;
		}
	}
	const q = makeFilter();
	const page = await searchService.search({ ...q, weights: localWeights } as any);
	items = page;
	if (page.length < PAGE_SIZE) reachedEnd = true;
	if (!selectedRole && !selectedType && !selectedOrgLevel && !searchTerm) {
		try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ items, reachedEnd, ts: Date.now() })); } catch {}
	}
	const last = page[page.length - 1];
	lastCursor = nextPageCursor(last, q);
	loading = false;
}

async function loadMore() {
	if (loadingMore || reachedEnd || !items.length) return;
	loadingMore = true;
	const q = makeFilter();
	const page = await searchService.search({ ...q, weights: localWeights } as any);
	items = [...items, ...page];
	if (page.length < PAGE_SIZE) reachedEnd = true;
	const last = page[page.length - 1];
	lastCursor = nextPageCursor(last, q);
	loadingMore = false;
}

function cancelInFlight() {
	if (abortCtrl) { abortCtrl.abort(); abortCtrl = null; }
}

$: if (searchTerm !== undefined) {
	clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => { loadFirst(); }, 300);
}

$: if (selectedType !== undefined || selectedRole !== undefined || selectedOrgLevel !== undefined) {
	clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => { loadFirst(); }, 200);
}

function applyWeightsChange() { weightsVersion++; loadFirst(); }

$: issuerPrefixPct = localWeights.partialTokenIssuerFactor * 100;
$: ownerPrefixPct = localWeights.partialTokenOwnerFactor * 100;

$: filteredItems = items;
</script>

<div class="space-y-6">
	<div class="text-center">
		<h2 class="text-3xl font-bold text-gray-900">รายการผลงานและรางวัล</h2>
		<p class="text-gray-600 mt-2">ค้นหาและเรียกดูผลงานของสมาชิกในโรงเรียน</p>
	</div>

	<!-- Search and Filter -->
	<div class="card p-6">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<div>
				<label for="search" class="form-label">ค้นหา</label>
				<div class="relative">
					<input 
						id="search"
						type="text" 
						class="form-input pl-10"
						bind:value={searchTerm}
						placeholder="ค้นหาชื่อเรื่อง, ชื่อคน, หน่วยงาน..."
					/>
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
						</svg>
					</div>
				</div>
			</div>
			
			<div>
				<label for="type-filter" class="form-label">ประเภท</label>
				<select id="type-filter" class="form-input" bind:value={selectedType}>
					<option value="">ทั้งหมด</option>
					<option value="certificate">📜 เกียรติบัตร</option>
					<option value="diploma">🎓 วุฒิบัตร</option>
					<option value="award">🏆 รางวัล</option>
					<option value="competition">🏃‍♂️ การแข่งขัน</option>
					<option value="training">📚 การอบรม</option>
					<option value="other">✨ อื่น ๆ</option>
				</select>
			</div>
			
			<div>
				<label for="role-filter" class="form-label">บทบาท</label>
				<select id="role-filter" class="form-input" bind:value={selectedRole}>
					<option value="">ทั้งหมด</option>
					<option value="admin">👨‍💼 ผู้บริหาร</option>
					<option value="teacher">👨‍🏫 ครู</option>
					<option value="student">👨‍🎓 นักเรียน</option>
				</select>
			</div>
			<div>
				<label for="org-filter" class="form-label">ระดับองค์กร</label>
				<select id="org-filter" class="form-input" bind:value={selectedOrgLevel}>
					<option value="">ทั้งหมด</option>
					<option value="school">โรงเรียน</option>
					<option value="district">เขต</option>
					<option value="province">จังหวัด</option>
					<option value="national">ประเทศ</option>
				</select>
			</div>
		</div>
		<div class="mt-4 flex justify-between items-center">
			<button class="text-sm text-green-600 hover:text-green-700" on:click={() => showAdvanced = !showAdvanced}>{showAdvanced ? 'ซ่อนตัวปรับขั้นสูง' : 'ตัวปรับน้ำหนักขั้นสูง'}</button>
			{#if showAdvanced}
				<button class="text-xs text-gray-500 hover:text-gray-700" on:click={() => { resetSearchWeights(); weightsVersion++; loadFirst(); }}>รีเซ็ตค่าเริ่มต้น</button>
			{/if}
		</div>
		{#if showAdvanced}
			<div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="p-3 border rounded bg-white">
					<label for="w-issuer" class="block text-xs font-medium text-gray-600 mb-1">Issuer Weight ({localWeights.issuerWeight})</label>
					<input id="w-issuer" type="range" min="5" max="40" step="1" bind:value={localWeights.issuerWeight} on:change={() => { searchWeights.set({ ...localWeights }); applyWeightsChange(); }} />
				</div>
				<div class="p-3 border rounded bg-white">
					<label for="w-owner" class="block text-xs font-medium text-gray-600 mb-1">Owner Name Weight ({localWeights.ownerNameWeight})</label>
					<input id="w-owner" type="range" min="5" max="40" step="1" bind:value={localWeights.ownerNameWeight} on:change={() => { searchWeights.set({ ...localWeights }); applyWeightsChange(); }} />
				</div>
				<div class="p-3 border rounded bg-white">
					<label for="w-title-pt" class="block text-xs font-medium text-gray-600 mb-1">Partial Token Title Boost ({localWeights.partialTokenTitleBoost})</label>
					<input id="w-title-pt" type="range" min="5" max="50" step="1" bind:value={localWeights.partialTokenTitleBoost} on:change={() => { searchWeights.set({ ...localWeights }); applyWeightsChange(); }} />
				</div>
			</div>
			<div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="p-3 border rounded bg-white">
					<label for="w-issuer-pref" class="block text-xs font-medium text-gray-600 mb-1">Issuer Prefix Factor ({issuerPrefixPct.toFixed(0)}%)</label>
					<input id="w-issuer-pref" type="range" min="10" max="100" step="5" bind:value={issuerPrefixPct} on:change={() => { localWeights.partialTokenIssuerFactor = issuerPrefixPct/100; searchWeights.set({ ...localWeights }); applyWeightsChange(); }} />
				</div>
				<div class="p-3 border rounded bg-white">
					<label for="w-owner-pref" class="block text-xs font-medium text-gray-600 mb-1">Owner Prefix Factor ({ownerPrefixPct.toFixed(0)}%)</label>
					<input id="w-owner-pref" type="range" min="10" max="100" step="5" bind:value={ownerPrefixPct} on:change={() => { localWeights.partialTokenOwnerFactor = ownerPrefixPct/100; searchWeights.set({ ...localWeights }); applyWeightsChange(); }} />
				</div>
				<div class="p-3 border rounded bg-white">
					<label for="w-desc-pref" class="block text-xs font-medium text-gray-600 mb-1">Description Prefix Boost ({localWeights.partialTokenDescriptionBoost})</label>
					<input id="w-desc-pref" type="range" min="0" max="15" step="1" bind:value={localWeights.partialTokenDescriptionBoost} on:change={() => { searchWeights.set({ ...localWeights }); applyWeightsChange(); }} />
				</div>
			</div>
		{/if}
	</div>

	<!-- Results -->
	{#if loading}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each Array(6) as _}
				<div class="animate-pulse rounded-lg border border-gray-200 p-4 bg-white shadow-sm space-y-3">
					<div class="h-40 w-full bg-gradient-to-r from-gray-200 to-gray-100 rounded-md"></div>
					<div class="h-4 bg-gray-200 rounded w-3/4"></div>
					<div class="h-3 bg-gray-100 rounded w-full"></div>
				</div>
			{/each}
		</div>
	{:else if filteredItems.length === 0}
		<div class="text-center py-12">
			<svg class="h-24 w-24 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
			</svg>
			<h3 class="text-lg font-medium text-gray-900 mt-4">ไม่พบข้อมูล</h3>
			<p class="text-gray-600 mt-2">
				{#if items.length === 0}
					ยังไม่มีผลงานในระบบ
				{:else}
					ไม่พบผลงานที่ตรงกับเงื่อนไขการค้นหา
				{/if}
			</p>
			{#if items.length === 0}
				<div class="mt-6">
					<Button href="/submit" variant="primary" size="md" className="inline-flex gap-2">
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
						</svg>
						บันทึกผลงานแรก
					</Button>
				</div>
			{/if}
		</div>
	{:else}
		<div class="mb-4 flex items-center justify-between">
			<p class="text-gray-600">
				พบ <span class="font-semibold text-gray-900">{filteredItems.length}</span> รายการ {#if !reachedEnd} (แสดงบางส่วน) {/if}
			</p>
			<button 
				class="text-sm text-green-600 hover:text-green-700"
				on:click={() => {
					searchTerm = ''; selectedType=''; selectedRole=''; selectedOrgLevel=''; loadFirst();
				}}
			>
				ล้างตัวกรอง
			</button>
		</div>
		
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each filteredItems as item}
				<a href={'/achievements/' + item.id} class="block hover:scale-[1.02] transition-transform duration-200">
					<AchievementCard 
						title={item.title}
						ownerName={item.ownerName}
						ownerRole={item.ownerRole}
						issuer={item.issuer}
						date={item.date}
						type={item.type}
						fileUrl={item.fileUrl}
						evidence={item.evidence}
						url={item.url}
					/>
				</a>
			{/each}
		</div>
		<div class="mt-8 flex justify-center">
			{#if !reachedEnd}
				<Button type="button" variant="primary" size="md" disabled={loadingMore} on:click={loadMore}>{loadingMore ? 'กำลังโหลด...' : 'โหลดเพิ่ม'}</Button>
			{:else}
				<p class="text-sm text-gray-500">แสดงครบแล้ว</p>
			{/if}
		</div>
	{/if}
</div>
