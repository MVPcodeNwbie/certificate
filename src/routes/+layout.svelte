<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import ToastContainer from '$lib/presentation/components/ToastContainer.svelte';
	import ErrorBoundary from '$lib/presentation/components/ErrorBoundary.svelte';
	// Register event listeners for projections (search metadata, audit) once at app bootstrap
	import '$lib/infrastructure/projections/search-metadata-listener';
	import '$lib/infrastructure/projections/audit-listener';
	import { theme, toggleTheme } from '$lib/presentation/stores/theme';
	// Removed unused params export to avoid noisy unknown prop warnings.
	// Re-introduced because dev runtime still injects 'params' prop; declaring silences warnings.
	export let params: Record<string,string> | undefined; void params;
	$: current = $page.url.pathname;
</script>

<svelte:head>
	<title>ระบบจัดการผลงาน</title>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-green-50 to-orange-50">
	<header class="bg-white shadow-sm border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-4">
				<div class="flex items-center space-x-4">
					<div class="flex items-center">
						<div class="w-8 h-8 bg-gradient-to-br from-green-300 to-orange-300 rounded-lg flex items-center justify-center">
							<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
							</svg>
						</div>
						<h1 class="ml-3 text-xl font-bold text-gray-900">ระบบจัดการผลงาน</h1>
					</div>
				</div>
				<nav class="flex space-x-3 items-center">
					<a href="/" class="nav-link {current === '/' ? 'nav-link-active' : ''}">หน้าแรก</a>
					<a href="/achievements" class="nav-link {current.startsWith('/achievements') ? 'nav-link-active' : ''}">รายการทั้งหมด</a>
					<a href="/submit" class="nav-link nav-link-active hidden sm:inline-flex gradient-brand-soft-x">บันทึกข้อมูล</a>
					<button type="button" class="ml-2 inline-flex items-center px-3 py-2 rounded-button text-sm font-medium bg-neutral-200 hover:bg-neutral-300 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600 transition" on:click={toggleTheme} aria-label="Toggle theme">
						{#if $theme === 'dark'}☀️ สว่าง{:else}🌙 มืด{/if}
					</button>
				</nav>
			</div>
		</div>
	</header>
	
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<ErrorBoundary>
			<slot />
		</ErrorBoundary>
	</main>

	<ToastContainer />
	
	<footer class="bg-white border-t border-gray-200 mt-16">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div class="text-center text-gray-500">
				<p class="text-sm">กลุ่มบริหารงานบุคคล โรงเรียนวัดแสงสรรค์</p>
				<p class="text-xs mt-2">พัฒนาระบบโดย นายณัฐพล สีจาด รองผู้อำนวยการสถานศึกษา</p>
			</div>
		</div>
	</footer>
</div>
