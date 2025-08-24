<script lang="ts">
  import type { FileEvidence } from '$lib/domain/achievement';
  export let evidence: FileEvidence[] = [];
  import { filterEvidence } from './evidence-filter';
  // Hide thumbnail duplicates (isThumbnail=true) if a non-thumbnail image exists.
  $: displayedEvidence = filterEvidence(evidence);
  export let enableDelete: boolean = false;
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher<{ delete: { path: string } }>();
  export let title: string = 'หลักฐาน';
  let preview: FileEvidence | null = null;

  function openPreview(ev: FileEvidence) {
    if (ev.mimeType.startsWith('image/')) {
      preview = ev; // full-size shown in dialog
    } else {
      window.open(ev.url, '_blank');
    }
  }
  function download(ev: FileEvidence) {
    const a = document.createElement('a'); a.href = ev.url; a.download = ev.name; document.body.appendChild(a); a.click(); a.remove();
  }
  const isImage = (e: FileEvidence) => e.mimeType.startsWith('image/');
</script>

<div class="space-y-3">
  <h3 class="text-lg font-semibold flex items-center gap-2">
    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
  {title} ({displayedEvidence.length})
  </h3>
  {#if !evidence.length}
    <p class="text-sm text-gray-500">ไม่มีไฟล์หลักฐาน</p>
  {:else}
    <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each displayedEvidence as ev, i}
        {#key ev.path}
        <li class="group relative border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition">
          {#if isImage(ev)}
            {#if ev.isThumbnail}
              <!-- Hidden normally if other non-thumb images exist; if visible here means it's the only image -->
              <img src={ev.url} alt={ev.name} loading="lazy" class="h-40 w-full object-cover" />
            {:else}
              <!-- Non-thumbnail image: still show but mark for potential future lazy swap -->
              <img src={ev.url} alt={ev.name} loading="lazy" class="h-40 w-full object-cover" />
            {/if}
          {:else}
            <div class="h-40 w-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 text-amber-700">
              <svg class="w-12 h-12 mb-2" fill="currentColor" viewBox="0 0 20 20"><path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h5.5a.5.5 0 000-1H4a1 1 0 01-1-1V4a1 1 0 011-1h8a1 1 0 011 1v3h3v2.5a.5.5 0 001 0V8a1 1 0 00-.293-.707l-4-4A1 1 0 0011 3H4z"/><path d="M9 7a2 2 0 012-2h1v3a1 1 0 001 1h3v6a2 2 0 01-2 2h-4.5a.5.5 0 000 1H14a3 3 0 003-3V8.414A1 1 0 0016.707 7L12 2.293A1 1 0 0011.293 2H11a3 3 0 00-3 3v6.5a.5.5 0 001 0V7z"/></svg>
              <span class="text-xs font-medium truncate max-w-[90%]" title={ev.name}>{ev.name}</span>
              <span class="text-[10px] text-gray-500">PDF</span>
            </div>
          {/if}
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button type="button" class="px-2 py-1 text-xs rounded bg-white/90 hover:bg-white shadow" on:click={() => openPreview(ev)}>ดู</button>
            <button type="button" class="px-2 py-1 text-xs rounded bg-gradient-to-r from-green-500 to-amber-500 text-white shadow hover:opacity-90" on:click={() => download(ev)}>ดาวน์โหลด</button>
            {#if enableDelete}
              <button type="button" class="px-2 py-1 text-xs rounded bg-red-600 text-white shadow hover:bg-red-700" on:click={() => dispatch('delete', { path: ev.path })}>ลบ</button>
            {/if}
          </div>
          <div class="absolute top-1 left-1 bg-white/90 text-[10px] px-1.5 py-0.5 rounded shadow">{i + 1}</div>
  </li>
  {/key}
      {/each}
    </ul>
  {/if}
</div>

{#if preview}
  <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
    <div class="bg-white rounded-lg max-w-4xl w-full shadow-lg overflow-hidden flex flex-col">
      <div class="flex items-center justify-between px-4 py-2 border-b">
        <h4 class="font-semibold text-gray-800 truncate" title={preview.name}>{preview.name}</h4>
        <div class="flex items-center gap-2">
          <button class="text-sm text-green-600 hover:text-green-700" on:click={() => preview && window.open(preview.url,'_blank')}>เปิดแท็บใหม่</button>
          <button class="text-sm text-gray-500 hover:text-gray-700" on:click={() => preview = null}>ปิด</button>
        </div>
      </div>
      <div class="p-4 overflow-auto bg-gray-50">
        {#if preview.mimeType.startsWith('image/')}
          <img src={preview.url} alt={preview.name} class="max-h-[70vh] mx-auto object-contain" />
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  :global(body) { overscroll-behavior: contain; }
</style>
