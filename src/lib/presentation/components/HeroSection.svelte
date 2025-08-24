<script lang="ts">
	export let title: string;
	export let subtitle: string | undefined = undefined;
	export let primaryCta: { label: string; href: string };
	export let secondaryCta: { label: string; href: string } | undefined = undefined;
	import Button from '$lib/presentation/components/Button.svelte';
</script>

<section class="relative overflow-hidden rounded-2xl gradient-brand-soft px-6 py-20 md:py-28 text-center shadow-lg">
	<div class="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_40%_30%,rgba(255,255,255,0.9),transparent_65%)]"></div>
	<div class="relative max-w-4xl mx-auto space-y-8">
		<h1 class="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-green-950 drop-shadow-sm">
			{@html title}
		</h1>
		{#if subtitle}
			<p class="text-lg md:text-2xl text-green-950/90 max-w-2xl mx-auto leading-relaxed animate-fade">{subtitle}</p>
		{/if}
		<div class="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
			<!-- Migrated to Button component for consistency -->
			<Button href={primaryCta.href} variant="primary" size="lg" className="hover:scale-[1.03] active:scale-[0.97] transition-transform">{primaryCta.label}</Button>
			{#if secondaryCta}
				<Button href={secondaryCta.href} variant="secondary" size="lg" className="hover:scale-[1.03] active:scale-[0.97] transition-transform">{secondaryCta.label}</Button>
			{/if}
		</div>
	</div>
	<div class="pointer-events-none absolute -bottom-12 left-1/2 -translate-x-1/2 w-[140%] h-64 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.35),transparent_70%)] blur-2xl"></div>
</section>
