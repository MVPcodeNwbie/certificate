<script lang="ts" context="module">
export interface Category { icon: string; label: string }
</script>
<script lang="ts">
export let categories: Category[] = [];
</script>

<section class="mt-24 rounded-2xl border border-yellow-200 bg-white/80 backdrop-blur-md p-10 shadow-sm">
	<h2 class="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10 tracking-tight">
		ประเภทผลงานที่รองรับ
	</h2>
	<ul class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
		{#each categories as c (c.label)}
			<li class="group text-center">
				<div class="text-3xl md:text-4xl group-hover:scale-110 transition-transform drop-shadow-sm">
					{c.icon}
				</div>
				<p class="mt-2 text-sm md:text-base font-medium text-gray-700 group-hover:text-gray-900">
					{c.label}
				</p>
			</li>
		{/each}
	</ul>
</section>
