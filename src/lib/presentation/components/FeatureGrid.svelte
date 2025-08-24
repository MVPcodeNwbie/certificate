<script lang="ts" context="module">
export interface Feature { icon: string; title: string; desc: string; accent?: string }
</script>
<script lang="ts">
export let features: Feature[] = [];
</script>

<section class="mt-20">
	<div class="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
		{#each features as f (f.title)}
			<div class="group relative rounded-xl border border-white/60 bg-white/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
				<div class="absolute inset-px rounded-xl bg-gradient-to-br from-white/70 to-white/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
				<div class="relative flex items-start space-x-4">
					<div class="w-12 h-12 shrink-0 rounded-lg flex items-center justify-center text-2xl shadow-inner bg-gradient-to-br from-green-300 to-orange-300 text-green-900">
						<span>{f.icon}</span>
					</div>
					<div>
						<h3 class="font-semibold text-gray-900 text-lg leading-tight mb-1">{f.title}</h3>
						<p class="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
					</div>
				</div>
				<div class="mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-green-300 to-orange-300 group-hover:w-24 transition-all"></div>
			</div>
		{/each}
	</div>
</section>
