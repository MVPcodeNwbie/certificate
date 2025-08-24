<script lang="ts">
  import Button from '$lib/presentation/components/Button.svelte';
  export let error: any;
  export let status: number;
</script>

<div class="max-w-xl mx-auto text-center mt-20 p-8 bg-white rounded-lg shadow border border-red-200">
  <h1 class="text-2xl font-semibold text-danger-600">เกิดข้อผิดพลาด</h1>
  <p class="mt-4 text-gray-700">{status}: {error?.message || 'Unexpected error'}</p>
  {#if error?.stack}
    <pre class="mt-4 text-left text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">{error.stack}</pre>
  {/if}
  <Button href="/" variant="primary" size="md" className="mt-6 inline-block">กลับหน้าแรก</Button>
</div>
