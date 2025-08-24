<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { toast } from '../stores/toast';
  let error: Error | null = null;
  export let fallback: string = 'เกิดข้อผิดพลาดในการแสดงผลข้อมูล';
  function handleError(e: any) {
    if (e?.error instanceof Error) {
      error = e.error;
      toast.error(e.error.message || 'Unexpected error', 'ข้อผิดพลาด');
    }
  }
  function handleGlobalError(ev: ErrorEvent) {
    toast.error(ev.message, 'ข้อผิดพลาด');
  }
  function handleRejection(ev: PromiseRejectionEvent) {
    const msg = (ev.reason && (ev.reason.message || ev.reason.toString())) || 'Unhandled promise rejection';
    toast.error(msg, 'ข้อผิดพลาด');
  }
  onMount(() => {
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('sveltekit:error', handleError as any);
  });
  onDestroy(() => {
    window.removeEventListener('error', handleGlobalError);
    window.removeEventListener('unhandledrejection', handleRejection);
    window.removeEventListener('sveltekit:error', handleError as any);
  });
</script>

{#if error}
  <div class="p-4 border border-red-300 bg-red-50 rounded text-sm text-red-700">
    <div class="font-semibold mb-1">{fallback}</div>
    <div class="opacity-80 whitespace-pre-wrap">{error.message}</div>
  </div>
{:else}
  <slot />
{/if}

<style>
  :global(.dark) .bg-red-50 { background:#451a1a; }
</style>