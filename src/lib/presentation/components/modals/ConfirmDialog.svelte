<script lang="ts">
  import Button from '$lib/presentation/components/Button.svelte';
  export let open = false;
  export let title = 'ยืนยัน';
  export let message = 'ต้องการดำเนินการต่อหรือไม่?';
  export let confirmText = 'ยืนยัน';
  export let cancelText = 'ยกเลิก';
  export let loading = false;
  export let onConfirm: (()=>void|Promise<void>) | undefined;
  export let onCancel: (()=>void) | undefined;

  async function handleConfirm() {
    if (onConfirm) await onConfirm();
  }
</script>

{#if open}
  <div class="fixed inset-0 z-40 flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/40" role="button" tabindex="0" aria-label="ปิดหน้าต่างยืนยัน" on:click={onCancel} on:keydown={(e)=>{ if(e.key==='Escape'|| e.key==='Enter') onCancel && onCancel(); }}></div>
    <div class="relative z-50 w-full max-w-md bg-white rounded-lg shadow-lg p-6 space-y-4 animate-fade">
      <h2 class="text-lg font-semibold text-gray-900">{title}</h2>
      <p class="text-sm text-gray-600">{message}</p>
      <div class="flex justify-end gap-3 pt-2">
  <Button type="button" variant="secondary" size="sm" on:click={onCancel} disabled={loading} ariaLabel={cancelText}>{cancelText}</Button>
  <Button type="button" variant="danger" size="sm" on:click={handleConfirm} disabled={loading} ariaLabel={confirmText}>{loading ? 'กำลังดำเนินการ...' : confirmText}</Button>
      </div>
    </div>
  </div>
{/if}
