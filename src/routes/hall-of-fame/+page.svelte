<script lang='ts'>
import { onMount, onDestroy } from 'svelte';
import { AchievementFirebaseRepository } from '$lib/infrastructure/repositories/achievement-firebase-repo';
import AchievementCard from '$lib/presentation/components/AchievementCard.svelte';
import type { Achievement, Role } from '$lib/domain/achievement';
import type { RankedAchievement } from '$lib/domain/hall-of-fame/scoring';
// Defer heavy scoring util
let explainAchievementScore: any;
type ScoreComponent = { label: string; value: number };

// Extended type with score for HoF ranking
let featured: RankedAchievement[] = [];
let byRole: Record<Role, RankedAchievement[]> = { admin: [], teacher: [], student: [] };
let loading = true;
let selectedTab: 'featured' | Role = 'featured';
let filterType: string = '';
let filterRole: Role | '' = '';
let ownerWeight = 1;
let pageSize = 24;
let currentPage = 1;
let rankedAll: RankedAchievement[] = [];
let explainTarget: RankedAchievement | null = null;
let explainData: { label: string; value: number; }[] = [];
let explainTotal = 0;
let closeBtn: HTMLButtonElement | null = null;
let escapeBound = false;

function escListener(e: KeyboardEvent){
  if(e.key === 'Escape') {
    e.preventDefault();
    closeExplain();
  }
}

const repo = new AchievementFirebaseRepository();

onMount(async () => {
  const all: Achievement[] = await repo.list(800);
  const mod = await import('$lib/domain/hall-of-fame/scoring');
  explainAchievementScore = mod.explainAchievementScore;
  rankedAll = mod.rankHallOfFame(all, Date.now(), { ownerWeight });
  applyFilters();
  loading = false;
});

function applyFilters() {
  let rows = rankedAll;
  if (filterType) rows = rows.filter(r => r.type === filterType);
  if (filterRole) rows = rows.filter(r => r.ownerRole === filterRole);
  featured = rows.slice(0, 12);
  const grouped: Record<Role, RankedAchievement[]> = { admin: [], teacher: [], student: [] };
  rows.forEach(r => { grouped[r.ownerRole].push(r); });
  byRole = {
    admin: grouped.admin.slice(0, currentPage * 6),
    teacher: grouped.teacher.slice(0, currentPage * 6),
    student: grouped.student.slice(0, currentPage * 6)
  };
}

function loadMore() {
  currentPage += 1;
  applyFilters();
}

function recomputeWeight() {
  import('$lib/domain/hall-of-fame/scoring').then(({ rankHallOfFame }) => {
    rankedAll = rankHallOfFame(rankedAll, Date.now(), { ownerWeight });
    currentPage = 1;
    applyFilters();
  });
}

function openExplain(a: RankedAchievement){
  const exp = explainAchievementScore ? explainAchievementScore(a, Date.now(), ownerWeight) : { components: [] as ScoreComponent[], total:0 };
  explainTarget = a;
  explainData = exp.components.map((c: ScoreComponent)=>({label:c.label,value:Math.round(c.value)}));
  explainTotal = Math.round(exp.total);
  // focus management after DOM updates
  setTimeout(()=>{ closeBtn?.focus(); }, 0);
}
function closeExplain(){ explainTarget=null; }

$: {
  if (explainTarget && !escapeBound) {
    window.addEventListener('keydown', escListener);
    escapeBound = true;
  } else if (!explainTarget && escapeBound) {
    window.removeEventListener('keydown', escListener);
    escapeBound = false;
  }
}

onDestroy(()=>{ if(escapeBound) window.removeEventListener('keydown', escListener); });


const tabs: { id: 'featured' | Role; label: string; icon: string }[] = [
  { id: 'featured', label: 'เด่นสุด', icon: '🏆' },
  { id: 'admin', label: 'ผู้บริหาร', icon: '👔' },
  { id: 'teacher', label: 'ครู', icon: '👩‍🏫' },
  { id: 'student', label: 'นักเรียน', icon: '🎓' }
];

function getItemsForTab(tab: 'featured' | Role): RankedAchievement[] {
  return tab === 'featured' ? featured : byRole[tab];
}

// Map RankedAchievement to the exact prop shape AchievementCard expects (ensure keys exist)
function toCardProps(a: RankedAchievement) {
  return {
    title: a.title,
    ownerName: a.ownerName,
    ownerRole: a.ownerRole,
    issuer: a.issuer ?? undefined,
    date: a.date ?? undefined,
    type: a.type,
    fileUrl: (a as any).fileUrl ?? undefined,
    evidence: a.evidence ?? undefined,
    url: a.url ?? undefined
  };
}

function translateLabel(label: string): string {
  switch (label.toLowerCase()) {
    case 'evidence': return 'หลักฐาน';
    case 'description': return 'รายละเอียด';
    case 'recency': return 'ความใหม่';
    case 'url': return 'ลิงก์';
    case 'issuer': return 'ผู้ออก';
    case 'orglevel': return 'ระดับพื้นที่';
    case 'type': return 'ประเภท';
    default:
      if (label.toLowerCase().startsWith('ownerbonus')) return 'Owner Bonus';
      return label;
  }
}
</script>

<div class="space-y-8">
  <div class="text-center space-y-4">
    <h1 class="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-orange-300">Hall of Fame</h1>
    <p class="text-gray-600 text-lg max-w-2xl mx-auto">
      ผลงานเด่นที่ได้รับการยอมรับ มีการจัดเก็บหลักฐานครบถ้วน และเป็นแรงบันดาลใจให้ผู้อื่น
    </p>
    <details class="max-w-3xl mx-auto text-left bg-white/70 backdrop-blur-sm border border-gray-200 rounded-lg p-4 group">
      <summary class="cursor-pointer font-medium text-green-800 flex items-center gap-2">
        วิธีคิดคะแนน (Scoring)
        <span class="text-xs text-green-700 group-open:rotate-90 transition-transform">▶</span>
      </summary>
      <div class="mt-3 space-y-3 text-sm text-gray-700 leading-relaxed">
  <p>ระบบจัดอันดับ (0–100) แบ่งสัดส่วน: Evidence 10, Description 25, Recency 15, URL 5, Issuer 10, Org Level 15, Type 10, Owner Bonus 10.</p>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>หลักฐาน (Evidence)</strong>: มีไฟล์ ≥1 (10 คะแนน)</li>
          <li><strong>รายละเอียด (Description)</strong>: สเกลตามจำนวนอักษรจนเต็ม 25</li>
          <li><strong>ความใหม่ (Recency)</strong>: ใหม่เต็ม 15 ค่อย ๆ ลดลงตามอายุ</li>
          <li><strong>ลิงก์อ้างอิง (URL)</strong>: ถ้ามี +5</li>
          <li><strong>ผู้ออก (Issuer)</strong>: มี/ยาวพอ +10</li>
          <li><strong>ระดับพื้นที่ (Org Level)</strong>: map สู่ 0–15 (national สูงสุด)</li>
          <li><strong>ประเภท (Type)</strong>: map สู่ 0–10 (award สูงสุด)</li>
          <li><strong>Owner Bonus</strong>: รวมผลงานอื่นของเจ้าของ (ชิ้นที่ 2 ขึ้นไป *20 แบบมีเพดาน), log(จำนวนไฟล์รวม) ให้ผลตอบแทนลดหลั่น และความใหม่ล่าสุด (สามส่วนนี้ถูก normalize และ cap ที่ 0–10)</li>
        </ul>
        <p class="text-xs text-gray-500">สูตรเต็มดูได้ที่ docs: <code>docs/scoring-formulas.md</code>. กำลังพัฒนา: แท็กเชิงความหมาย และ engagement (views / likes).</p>
      </div>
    </details>
  </div>
  
  {#if loading}
    <div class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
      <p class="text-gray-500">กำลังค้นหาผลงานเด่น...</p>
    </div>
  {:else}
    <!-- Filters -->
  <div class="flex flex-wrap gap-4 justify-center mb-6 items-center">
      <select class="form-input" bind:value={filterType} on:change={() => { currentPage = 1; applyFilters(); }}>
        <option value="">ทุกประเภท</option>
        <option value="certificate">เกียรติบัตร</option>
        <option value="diploma">ประกาศนียบัตร</option>
        <option value="award">รางวัล</option>
        <option value="competition">การแข่งขัน</option>
        <option value="training">การอบรม</option>
        <option value="other">อื่นๆ</option>
      </select>
      <select class="form-input" bind:value={filterRole} on:change={() => { currentPage = 1; applyFilters(); }}>
        <option value="">ทุกบทบาท</option>
        <option value="admin">ผู้บริหาร</option>
        <option value="teacher">ครู</option>
        <option value="student">นักเรียน</option>
      </select>
      <div class="flex items-center gap-2">
        <label for="ownerWeightRange" class="text-sm text-gray-600">Owner Weight</label>
        <input id="ownerWeightRange" aria-label="Owner Weight" type="range" min="0" max="2" step="0.1" bind:value={ownerWeight} on:change={recomputeWeight} />
        <span class="text-sm w-8 text-center">{ownerWeight.toFixed(1)}</span>
      </div>
      {#if filterType || filterRole}
        <button class="text-sm text-red-600 hover:underline" on:click={() => { filterType=''; filterRole=''; currentPage=1; applyFilters(); }}>ล้างตัวกรอง</button>
      {/if}
    </div>
    <!-- Tab Navigation -->
    <div class="flex flex-wrap justify-center gap-2 mb-8">
      {#each tabs as tab}
        <button 
          class="px-6 py-3 rounded-full font-medium transition-all duration-200 {selectedTab === tab.id 
            ? 'bg-gradient-to-r from-green-500 to-orange-500 text-white shadow-lg' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
          on:click={() => selectedTab = tab.id}
        >
          {tab.icon} {tab.label}
        </button>
      {/each}
    </div>

    <!-- Content Display -->
    {#each tabs as tab}
      {#if selectedTab === tab.id}
        {@const items = getItemsForTab(tab.id)}
        
        {#if !items.length}
          <div class="text-center py-12">
            <div class="text-6xl mb-4">🏆</div>
            <p class="text-gray-500 text-lg">ยังไม่มีผลงานเด่นในหมวดนี้</p>
            <p class="text-gray-400 text-sm mt-2">ผลงานจะถูกเลือกตามคุณภาพและความสมบูรณ์ของข้อมูล</p>
          </div>
        {:else}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {#each items as item, index}
              <div class="relative">
                {#if index < 3 && tab.id === 'featured'}
                  <!-- Medal badges for top 3 featured -->
                  <div class="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg
                    {index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900' : 
                     index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-gray-800' : 
                     'bg-gradient-to-r from-orange-300 to-orange-500 text-orange-900'}">
                    {index + 1}
                  </div>
                {/if}
        <a href={'/achievements/' + item.id} class="block hover:scale-[1.03] transition-transform duration-200 group">
                  <AchievementCard {...toCardProps(item)} />
                  <div class="mt-1 text-[11px] text-gray-500 flex flex-wrap gap-2">
                    <span>🏅 {Math.round(item.hofScore)}</span>
                    <span>base {Math.round(item.baseScore)}</span>
                    <span>owner+ {Math.round(item.ownerBonus)}</span>
                    <span class="truncate max-w-[120px]" title={`ผลงานทั้งหมดเจ้าของ: ${item.ownerAggregate.count}`}>Σ{item.ownerAggregate.count}</span>
          <button type="button" class="opacity-0 group-hover:opacity-100 transition-opacity underline text-blue-600" on:click|preventDefault={() => openExplain(item)}>explain</button>
                  </div>
                </a>
              </div>
            {/each}
          </div>
          {#if tab.id !== 'featured' && items.length >= currentPage * 6}
            <div class="text-center mt-8">
              <button class="px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-orange-500 text-white font-medium shadow hover:shadow-lg" on:click={loadMore}>โหลดเพิ่มเติม</button>
            </div>
          {/if}
        {/if}
      {/if}
    {/each}

    <!-- Criteria Info -->
    <div class="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border border-blue-200">
      <h3 class="text-lg font-semibold text-gray-800 mb-3">🎯 เกณฑ์การคัดเลือก</h3>
      <div class="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
        <div class="flex items-start gap-2">
          <span class="text-green-500">📎</span>
          <span><strong>หลักฐานครบถ้วน:</strong> มีไฟล์หลักฐานหลากหลายและชัดเจน</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-blue-500">📝</span>
          <span><strong>รายละเอียดดี:</strong> มีคำอธิบายผลงานที่ละเอียด</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-yellow-500">🔗</span>
          <span><strong>การอ้างอิง:</strong> มีลิงก์หรือแหล่งอ้างอิงภายนอก</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-purple-500">🏢</span>
          <span><strong>หน่วยงานชัดเจน:</strong> ระบุผู้ออกเกียรติบัตร/รางวัล</span>
        </div>
      </div>
    </div>
  {/if}
</div>

{#if explainTarget}
  <div class="fixed inset-0 z-50 flex items-center justify-center" aria-labelledby="score-explain-title" aria-describedby="score-explain-desc" role="dialog" aria-modal="true">
    <button type="button" class="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-label="ปิดหน้าต่างคะแนน (Esc เพื่อปิด)" on:click={closeExplain}></button>
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative focus:outline-none" tabindex="-1">
      <button bind:this={closeBtn} class="absolute top-2 right-2 text-gray-500 hover:text-gray-700" on:click={closeExplain} aria-label="ปิด">✕</button>
      <h4 id="score-explain-title" class="text-lg font-semibold mb-2">รายละเอียดคะแนน</h4>
      <p id="score-explain-desc" class="text-sm text-gray-600 mb-4 truncate" title={explainTarget.title}>{explainTarget.title}</p>
      <ul class="space-y-1 text-sm">
        {#each explainData as c}
          <li class="flex justify-between">
            <span>{translateLabel(c.label)}</span>
            <span class="font-mono">{c.value}</span>
          </li>
        {/each}
      </ul>
      <div class="border-t mt-4 pt-2 flex justify-between font-semibold">
        <span>รวม</span><span class="font-mono">{explainTotal}</span>
      </div>
      <div class="mt-4 text-right">
        <button class="px-4 py-2 rounded bg-gradient-to-r from-green-500 to-orange-500 text-white" on:click={closeExplain}>ปิด</button>
      </div>
    </div>
  </div>
{/if}
