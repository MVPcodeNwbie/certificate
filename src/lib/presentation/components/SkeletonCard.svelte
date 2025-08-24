<script lang='ts'>
  export let lines = 3;
  export let glass: boolean = false; // optional glass style
  export let shimmer: boolean = true; // enable shimmer animation
</script>
<div class="rounded-lg p-4 space-y-3 border shadow-sm {glass ? 'glass glass-edge' : 'bg-white border-gray-200'}">
  <div class="h-40 w-full rounded-md bg-gradient-to-r from-gray-200 to-gray-100 {shimmer ? 'shimmer' : 'animate-pulse'}"></div>
  <div class="h-4 rounded w-3/4 bg-gray-200 {shimmer ? 'shimmer' : 'animate-pulse'}"></div>
  {#each Array(lines-1) as _}
    <div class="h-3 rounded w-full bg-gray-100 {shimmer ? 'shimmer' : 'animate-pulse'}"></div>
  {/each}
</div>
