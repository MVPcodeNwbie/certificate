<script lang="ts">
  import Button from '$lib/presentation/components/Button.svelte';
  import Badge from '$lib/presentation/components/Badge.svelte';
  import { toggleTheme, theme } from '$lib/presentation/stores/theme';
  const variants: Array<{v: any; label: string}> = [
    { v: 'primary', label: 'Primary'},
    { v: 'secondary', label: 'Secondary'},
    { v: 'danger', label: 'Danger'},
    { v: 'outline', label: 'Outline'},
    { v: 'ghost', label: 'Ghost'},
  ];
  const badgeColors: Array<any> = ['brand','neutral','success','warning','danger'];
</script>

<div class="space-y-16">
  <section>
    <h1 class="heading-1 mb-2">Design System Style Guide</h1>
    <p class="text-on-surface-muted">รวมตัวอย่าง Components และ tokens สำหรับการออกแบบ UI ที่สอดคล้องกัน</p>
    <div class="mt-4"><Button variant="outline" size="sm" on:click={toggleTheme}>Toggle Theme (ปัจจุบัน: {$theme})</Button></div>
  </section>

  <section class="space-y-4">
    <h2 class="heading-2">Buttons</h2>
    <div class="flex flex-wrap gap-4">
      {#each variants as v}
        <Button variant={v.v} size="sm">{v.label} sm</Button>
      {/each}
    </div>
    <div class="flex flex-wrap gap-4 mt-4">
      {#each variants as v}
        <Button variant={v.v} size="md">{v.label} md</Button>
      {/each}
    </div>
    <div class="flex flex-wrap gap-4 mt-4">
      {#each variants as v}
        <Button variant={v.v} size="lg">{v.label} lg</Button>
      {/each}
    </div>
  </section>

  <section class="space-y-4">
    <h2 class="heading-2">Badges</h2>
    <div class="flex flex-wrap gap-3">
      {#each badgeColors as c}
        <Badge color={c}>{c}</Badge>
      {/each}
      {#each badgeColors as c}
        <Badge color={c} outline>{c} outline</Badge>
      {/each}
    </div>
  </section>

  <section class="space-y-4">
    <h2 class="heading-2">Typography Scale</h2>
    <div class="space-y-2">
      <div class="heading-display">Heading Display</div>
      <div class="heading-1">Heading 1</div>
      <div class="heading-2">Heading 2</div>
      <div class="heading-3">Heading 3</div>
      <div class="heading-4">Heading 4</div>
      <div class="heading-eyebrow">Eyebrow Label</div>
      <p class="text-sm text-on-surface-muted">Body / helper text example. Lorem ipsum dolor sit amet.</p>
    </div>
  </section>

  <section class="space-y-4">
    <h2 class="heading-2">Card</h2>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="card p-4 space-y-2">
        <h3 class="heading-4">Card Title</h3>
        <p class="text-sm text-on-surface-muted">รายละเอียดเนื้อหาแบบย่อภายใน card</p>
        <Button variant="primary" size="sm">Action</Button>
      </div>
      <div class="card p-4 space-y-2 dark:bg-neutral-800">
        <h3 class="heading-4">Dark Card</h3>
        <p class="text-sm text-on-surface-muted">ทดลองดูใน dark mode</p>
        <Button variant="outline" size="sm">Secondary</Button>
      </div>
      <div class="card p-4 space-y-2">
        <h3 class="heading-4">Gradient Use</h3>
        <div class="h-2 w-full rounded-full gradient-brand-soft" />
        <p class="text-xs text-on-surface-muted">Pastel gradient token (ใช้เน้นบริเวณ marketing / progress bar)</p>
      </div>
    </div>
  </section>

  <section class="space-y-4">
    <h2 class="heading-2">Glass Surfaces</h2>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="p-4 rounded-xl glass glass-edge space-y-2">
        <h3 class="heading-4">Glass (Light)</h3>
        <p class="text-sm text-on-surface-muted">ใช้สำหรับ overlay / floating panel</p>
        <Button variant="ghost" size="sm">Action</Button>
      </div>
      <div class="p-4 rounded-xl glass-dark glass-edge space-y-2 text-white">
        <h3 class="heading-4">Glass (Dark)</h3>
        <p class="text-sm text-white/70">สำหรับ dark mode หรือ hero overlay</p>
        <Button variant="outline" size="sm">Try</Button>
      </div>
      <div class="p-4 rounded-xl glass-edge gradient-brand-soft space-y-2">
        <h3 class="heading-4">Layered</h3>
        <p class="text-sm text-green-900/80">Gradient + glass border</p>
        <Button variant="secondary" size="sm">Ok</Button>
      </div>
    </div>
  </section>

  <section class="space-y-4">
    <h2 class="heading-2">Skeleton / Shimmer</h2>
    <div class="grid md:grid-cols-2 gap-6">
      <div class="rounded-lg border border-gray-200 p-4 bg-white shadow-sm space-y-3">
        <div class="h-40 w-full bg-gradient-to-r from-gray-200 to-gray-100 rounded-md shimmer"></div>
        <div class="h-4 bg-gray-200 rounded w-3/4 shimmer"></div>
        <div class="h-3 bg-gray-100 rounded w-full shimmer"></div>
        <div class="h-3 bg-gray-100 rounded w-5/6 shimmer"></div>
      </div>
      <div class="p-4 rounded-xl glass-dark glass-edge space-y-3">
        <div class="h-40 w-full bg-gradient-to-r from-slate-600 to-slate-700 rounded-md shimmer"></div>
        <div class="h-4 bg-slate-600 rounded w-3/4 shimmer"></div>
        <div class="h-3 bg-slate-700 rounded w-full shimmer"></div>
        <div class="h-3 bg-slate-700 rounded w-5/6 shimmer"></div>
      </div>
    </div>
    <p class="text-xs text-on-surface-muted">Shimmer ใช้เฉพาะ loading state ขนาดกลางถึงใหญ่ ไม่ควรใส่พร้อม skeleton ที่มีหลายสิบรายการ (อาจรบกวนสายตา)</p>
  </section>
</div>

<style>
  :global(main) { scroll-behavior: smooth; }
</style>
