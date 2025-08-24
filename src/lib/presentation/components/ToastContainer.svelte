<script lang="ts">
  import { toasts } from '../stores/toast';
  import { fly } from 'svelte/transition';
  function dismiss(id: string) { toasts.dismiss(id); }
</script>

<div class="fixed inset-x-0 top-4 z-50 flex flex-col items-center space-y-2 pointer-events-none">
  {#each $toasts as t (t.id)}
    <div in:fly={{ y: -10, duration: 150 }} out:fly={{ y: -10, duration: 150 }} class="pointer-events-auto px-4 py-3 rounded-lg shadow-md text-sm flex items-start gap-3 max-w-md w-full border bg-white" class:!bg-red-50={t.type==='error'} class:!bg-green-50={t.type==='success'} class:!bg-yellow-50={t.type==='warn'}>
      <div class="flex-1">
        {#if t.title}<div class="font-semibold mb-0.5">{t.title}</div>{/if}
        <div class="leading-snug">{t.message}</div>
      </div>
      <button class="text-gray-400 hover:text-gray-600" on:click={() => dismiss(t.id)} aria-label="Close">✕</button>
    </div>
  {/each}
</div>

<style>
  :global(.dark) .bg-white { background-color: #1f2937; color: #f3f4f6; }
</style>