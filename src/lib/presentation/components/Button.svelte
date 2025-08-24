<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  type Variant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  // (Optional) provide an exported interface if consumers want to import types in TS
  // export interface ButtonProps { type?: 'button'|'submit'|'reset'; variant?: Variant; size?: 'sm'|'md'|'lg'; href?: string; loading?: boolean; disabled?: boolean; block?: boolean; iconOnly?: boolean; rounded?: boolean; ariaLabel?: string; className?: string; }
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let variant: Variant = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let href: string | undefined = undefined; // optional link mode
  export let target: string | undefined = undefined; // only used when href present
  export let rel: string | undefined = undefined; // only used when href present
  export let loading: boolean = false;
  export let disabled: boolean = false;
  export let block: boolean = false;
  export let iconOnly: boolean = false;
  export let rounded: boolean = false;
  export let ariaLabel: string | undefined = undefined; // optional accessibility label
  // Optional extra class names (to avoid clashing with reserved 'class' in TS export scope)
  export let className: string = '';
  // Enable SvelteKit prefetch for anchor usage
  export let prefetch: boolean = false;

  const dispatch = createEventDispatcher();

  // Unified button tokens (semantic). Legacy gradient retained via .gradient-primary helper if needed.
  $: base = 'ui-btn inline-flex items-center justify-center font-medium leading-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded-button';
  $: variantClass = {
    primary: 'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700 focus-visible:ring-brand-500 shadow',
    secondary: 'bg-neutral-700 text-white hover:bg-neutral-600 active:bg-neutral-800 focus-visible:ring-neutral-500',
    danger: 'bg-danger-600 text-white hover:bg-danger-500 active:bg-danger-700 focus-visible:ring-danger-500',
    outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 focus-visible:ring-brand-500',
    ghost: 'text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200 focus-visible:ring-brand-500'
  }[variant];
  $: sizeClass = { sm: 'text-xs px-2 py-1 gap-1', md: 'text-sm px-4 py-2 gap-2', lg: 'text-base px-6 py-3 gap-2' }[size];
  $: shape = rounded ? 'rounded-full' : 'rounded-button';
  $: width = block ? 'w-full' : '';
  $: icon = iconOnly ? 'p-2 aspect-square' : '';
  $: classes = [base, variantClass, sizeClass, shape, width, icon, className].filter(Boolean).join(' ');

  function handleClick(e: MouseEvent) {
    if (disabled || loading) {
      // Block interaction when disabled/loading
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // Allow natural navigation for anchors; still emit event for analytics/logic.
    dispatch('click', e);
  }
</script>

{#if href}
  <a {href}
    {target}
    {rel}
    class={classes}
    aria-label={ariaLabel}
    aria-busy={loading}
    on:click={handleClick}
    {...(prefetch ? {'data-sveltekit-prefetch': ''} : {})}
  >
    {#if loading}
      <span class="ui-btn-spinner" aria-hidden="true" />
    {/if}
    <slot />
  </a>
{:else}
  <button {type}
    class={classes}
    aria-label={ariaLabel}
    aria-busy={loading}
    disabled={disabled || loading}
    on:click={handleClick}
  >
    {#if loading}
      <span class="ui-btn-spinner" aria-hidden="true" />
    {/if}
    <slot />
  </button>
{/if}

<style>
  .ui-btn-spinner {
    width: 1rem; height: 1rem; border-radius: 9999px;
    border: 2px solid rgba(255,255,255,0.4); border-top-color: rgba(255,255,255,1);
    animation: spin 0.6s linear infinite; margin-right: 0.5rem;
  }
  :global(.ui-btn[aria-busy="true"]) { position: relative; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
