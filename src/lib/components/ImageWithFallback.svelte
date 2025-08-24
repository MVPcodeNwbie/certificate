<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { preloadImage, getCachedStatus } from '$lib/utils/imageLoader';

  export let src: string;
  export let alt: string = '';
  // Use className because 'class' is a reserved prop; parent passes via className
  export let className: string = '';
  export let loading: 'lazy' | 'eager' = 'lazy';
  export let fallbackSrc: string = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="120"%3E%3Crect width="160" height="120" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".35em" fill="%239ca3af" font-family="sans-serif" font-size="14"%3EImage%20NA%3C/text%3E%3C/svg%3E';
  export let decode: boolean = true;
  export let preload: boolean = false;
  export let retry: number = 0;
  export let retryDelay: number = 600;
  export let revealTransitionMs: number = 250;

  const dispatch = createEventDispatcher();

  let state: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';
  let observer: IntersectionObserver | undefined;
  let imgEl: HTMLImageElement | null = null;
  let containerEl: HTMLElement | null = null;
  let attempts = 0;
  let currentSrc: string | undefined;
  let hasMounted = false;

  function setState(s: typeof state) { state = s; }

  async function beginLoad() {
    if (!src) return;
    if (state === 'loaded') return;
    attempts++;
    setState('loading');
    try {
      if (preload) {
        await preloadImage(src, { useFetchHead: true }).catch(() => {});
      }
      if (imgEl && currentSrc !== src) {
        imgEl.src = src;
        currentSrc = src;
      }
    } catch {}
  }

  function handleError() {
    if (attempts <= retry) {
      setTimeout(() => beginLoad(), retryDelay);
      return;
    }
    setState('error');
    dispatch('error', { src });
  }

  async function handleLoad() {
    if (decode && imgEl && 'decode' in imgEl) {
      try { await (imgEl as any).decode(); } catch {}
    }
    setState('loaded');
    dispatch('load', { src });
  }

  function setupObserver() {
    if (!containerEl) return;
    if (loading === 'eager') { beginLoad(); return; }
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            observer?.disconnect();
            beginLoad();
            break;
          }
        }
      }, { rootMargin: '120px' });
      observer.observe(containerEl);
    } else beginLoad();
  }

  onMount(() => {
    hasMounted = true;
    const cached = getCachedStatus(src);
    if (cached === 'loaded') {
      state = 'loaded';
      currentSrc = src;
    }
    setupObserver();
  });

  onDestroy(() => observer?.disconnect());

  $: if (hasMounted && src && src !== currentSrc) {
    attempts = 0;
    if (loading === 'eager') beginLoad();
    else {
      state = 'idle';
      observer?.disconnect();
      setupObserver();
    }
  }
</script>

<div class={className + ' relative overflow-hidden'} bind:this={containerEl}>
  <img
    bind:this={imgEl}
    {alt}
    src={state === 'loaded' ? src : ''}
    class="w-full h-full object-cover block"
    style="opacity:{state==='loaded'?1:0};transition:opacity {revealTransitionMs}ms"
    on:load={handleLoad}
    on:error={handleError}
    loading={loading}
  />
  {#if state === 'error'}
    {#if fallbackSrc}
      <img src={fallbackSrc} alt={alt || 'fallback'} class="absolute inset-0 w-full h-full object-cover opacity-70" aria-hidden={alt? 'true':'false'} />
    {/if}
    <div class="absolute inset-0 flex items-center justify-center bg-gray-100/70 text-gray-400 select-none">
      <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  {:else if state !== 'loaded'}
    <div class="absolute inset-0 animate-pulse bg-gray-200" />
  {/if}
</div>

<style>
  :global(img) { font-style: italic; }
</style>
