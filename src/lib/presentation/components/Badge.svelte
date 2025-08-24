<script lang="ts">
  export let color: 'brand' | 'neutral' | 'success' | 'warning' | 'danger' = 'neutral';
  export let size: 'sm' | 'md' = 'sm';
  export let rounded: boolean = true;
  export let outline: boolean = false;
  const base = 'inline-flex items-center font-medium select-none';
  $: sizeClass = size === 'sm' ? 'text-[11px] leading-4 px-2 py-0.5 gap-1' : 'text-xs leading-5 px-2.5 py-0.5 gap-1.5';
  $: radius = rounded ? 'rounded-full' : 'rounded-button';
  $: palette = outline
    ? {
        brand: 'text-brand-700 border border-brand-300 bg-brand-50',
        neutral: 'text-neutral-700 border border-neutral-300 bg-white',
        success: 'text-success-700 border border-success-300 bg-success-50',
        warning: 'text-warning-700 border border-warning-300 bg-warning-50',
        danger: 'text-danger-700 border border-danger-300 bg-danger-50'
      }[color]
    : {
        brand: 'bg-brand-100 text-brand-800',
        neutral: 'bg-neutral-200 text-neutral-800',
        success: 'bg-success-100 text-success-800',
        warning: 'bg-warning-100 text-warning-800',
        danger: 'bg-danger-100 text-danger-800'
      }[color];
  $: classes = [base, sizeClass, radius, palette].join(' ');
</script>
<span class={classes}><slot /></span>
