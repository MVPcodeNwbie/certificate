<script lang="ts">
  import Button from '$lib/presentation/components/Button.svelte';
  import { onMount } from 'svelte';
  let chartsReady = false;
  let Chart: any; // lazy-loaded
  let roleData = { labels: ['ผู้บริหาร','ครู','นักเรียน'], values: [0,0,0] };
  let typeData = { labels: ['เกียรติบัตร','ประกาศนียบัตร','รางวัล','การแข่งขัน','การอบรม','อื่นๆ'], values: [0,0,0,0,0,0] };
  let yearlyData: {year: number, count: number}[] = [];
  let growthData: {year:number, growth:number}[] = [];
  let totalCount = 0;
  let loading = true;
  let exporting = false;
  let academicYears: number[] = []; // distinct BE years (พ.ศ.)
  let selectedAcademicYear: number | '' = '';
  let matrix: { type: string; roleCounts: number[]; total: number }[] = []; // role order: admin, teacher, student
  let selectedOrgLevel: string | '' = '';
  let orgLevelDistribution: { level: string; count: number }[] = [];
  // Deep matrix: academicYear -> type -> role counts
  let deepMatrix: { academicYear: number; rows: { type: string; roleCounts: number[]; total: number }[]; totals: number[]; grand: number }[] = [];
  
  // Summary stats
  let summaryStats = {
    totalAchievements: 0,
    mostActiveRole: '',
    mostPopularType: '',
    avgPerMonth: 0
  };

  onMount(async () => {
    // Dynamic import only in browser; defer with microtask to let first paint happen
    await Promise.resolve();
    const mod = await import('chart.js/auto');
    Chart = mod.default;
    await loadStats();
    chartsReady = true;
  });

  async function loadStats() {
    try {
      const { getFirestore, collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
      const { db } = await import('$lib/infrastructure/firebase/client');
      const snap = await getDocs(query(collection(getFirestore(), 'achievements'), orderBy('createdAt','desc'), limit(500)) as any);
      const rows = snap.docs.map(d=>({ id: d.id, ...(d.data() as any) }));
      
      // Reset counters
      roleData.values = [0,0,0];
      typeData.values = [0,0,0,0,0,0];
  const yearlyCount: Record<number, number> = {};
  const orgLevelCount: Record<string, number> = {};
      
  const yearSet = new Set<number>();
  rows.forEach(r => {
        // Count by role with Thai labels mapping
        const roleMapping: Record<string, number> = { 'admin': 0, 'teacher': 1, 'student': 2 };
        if (r.ownerRole in roleMapping) roleData.values[roleMapping[r.ownerRole]]++;
        
        // Count by type with Thai labels mapping
        const typeMapping: Record<string, number> = { 
          'certificate': 0, 'diploma': 1, 'award': 2, 
          'competition': 3, 'training': 4, 'other': 5 
        };
        if (r.type in typeMapping) typeData.values[typeMapping[r.type]]++;
        
        // Count by year
        if (r.createdAt) {
          const year = new Date(r.createdAt).getFullYear();
          yearlyCount[year] = (yearlyCount[year] || 0) + 1;
        }
  if (typeof r.academicYear === 'number') yearSet.add(r.academicYear);
  if (r.orgLevel) orgLevelCount[r.orgLevel] = (orgLevelCount[r.orgLevel]||0)+1;
      });
  academicYears = Array.from(yearSet).sort((a,b)=>b-a); // desc
  buildMatrix(rows);
  buildDeepMatrix(rows);
orgLevelDistribution = Object.keys(orgLevelCount).map(k=>({ level:k, count: orgLevelCount[k] })).sort((a,b)=>b.count-a.count);
      
      // Prepare yearly data for line chart
  yearlyData = Object.entries(yearlyCount)
        .map(([year, count]) => ({ year: parseInt(year), count }))
        .sort((a, b) => a.year - b.year);
  growthData = yearlyData.map((d,i,arr)=> ({ year: d.year, growth: i===0?0: ((d.count - arr[i-1].count)/(arr[i-1].count||1))*100 }));
      
      // Calculate summary stats
      totalCount = rows.length;
      const maxRoleIndex = roleData.values.indexOf(Math.max(...roleData.values));
      const maxTypeIndex = typeData.values.indexOf(Math.max(...typeData.values));
      summaryStats = {
        totalAchievements: totalCount,
        mostActiveRole: roleData.labels[maxRoleIndex],
        mostPopularType: typeData.labels[maxTypeIndex],
        avgPerMonth: totalCount > 0 ? Math.round((totalCount / Math.max(1, yearlyData.length * 12)) * 10) / 10 : 0
      };
      
    } catch (e) { 
      console.warn('Failed to load stats', e); 
    }
    loading = false;
  }

  function buildMatrix(rows: any[]) {
    // Filter by academic year if selected
    let filtered = selectedAcademicYear ? rows.filter(r => r.academicYear === selectedAcademicYear) : rows;
    if (selectedOrgLevel) filtered = filtered.filter(r => r.orgLevel === selectedOrgLevel);
    const typeCodes: { code: string; label: string }[] = [
      { code: 'certificate', label: 'เกียรติบัตร' },
      { code: 'diploma', label: 'ประกาศนียบัตร' },
      { code: 'award', label: 'รางวัล' },
      { code: 'competition', label: 'การแข่งขัน' },
      { code: 'training', label: 'การอบรม' },
      { code: 'other', label: 'อื่นๆ' }
    ];
    const roleOrder: ('admin'|'teacher'|'student')[] = ['admin','teacher','student'];
    matrix = typeCodes.map(t => {
      const roleCounts = roleOrder.map(r => filtered.filter(row => row.type === t.code && row.ownerRole === r).length);
      const total = roleCounts.reduce((a,b)=>a+b,0);
      return { type: t.label, roleCounts, total };
    }).filter(r => r.total > 0);
  }
  function buildDeepMatrix(rows: any[]) {
    const roleOrder: ('admin'|'teacher'|'student')[] = ['admin','teacher','student'];
    const typeCodes: { code: string; label: string }[] = [
      { code: 'certificate', label: 'เกียรติบัตร' },
      { code: 'diploma', label: 'ประกาศนียบัตร' },
      { code: 'award', label: 'รางวัล' },
      { code: 'competition', label: 'การแข่งขัน' },
      { code: 'training', label: 'การอบรม' },
      { code: 'other', label: 'อื่นๆ' }
    ];
    const byYear: Record<number, any[]> = {};
    rows.forEach(r => { if (typeof r.academicYear === 'number') { (byYear[r.academicYear] ||= []).push(r); } });
    deepMatrix = Object.keys(byYear).map(yStr => {
      const y = parseInt(yStr);
      const yearRows = byYear[y];
      const dataRows = typeCodes.map(t => {
        const roleCounts = roleOrder.map(r => yearRows.filter(row => row.type === t.code && row.ownerRole === r).length);
        const total = roleCounts.reduce((a,b)=>a+b,0);
        return { type: t.label, roleCounts, total };
      }).filter(r => r.total>0);
      const totals = roleOrder.map((r,i) => dataRows.reduce((a,b)=>a+b.roleCounts[i],0));
      const grand = dataRows.reduce((a,b)=>a+b.total,0);
      return { academicYear: y, rows: dataRows, totals, grand };
    }).sort((a,b)=>b.academicYear - a.academicYear);
  }
  
  function mountChart(node: HTMLCanvasElement, kind: 'role'|'type'|'yearly') {
    if (!chartsReady || !Chart) return;
    let config;
    
    if (kind === 'yearly') {
      config = {
        type: 'line',
        data: { 
          labels: yearlyData.map(d => d.year.toString()),
          datasets: [{ 
            label: 'ผลงานต่อปี', 
            data: yearlyData.map(d => d.count),
            backgroundColor: 'rgba(34,197,94,0.2)',
            borderColor: 'rgba(34,197,94,1)',
            tension: 0.4,
            fill: true
          }] 
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false,
          plugins: { legend: { display: true } },
          scales: { 
            y: { beginAtZero: true, ticks: { precision: 0 } },
            x: { title: { display: true, text: 'ปี พ.ศ.' } }
          }
        }
      };
    } else {
      const dataset = kind === 'role' ? roleData : typeData;
      const colors = kind === 'role'
        ? ['rgba(16,185,129,0.8)', 'rgba(59,130,246,0.8)', 'rgba(245,158,11,0.8)']
        : ['rgba(34,197,94,0.8)', 'rgba(59,130,246,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)', 'rgba(139,92,246,0.8)', 'rgba(107,114,128,0.8)'];

      // Use pie chart for role distribution (original plan) and bar for type distribution
      if (kind === 'role') {
        config = {
          type: 'pie',
          data: {
            labels: dataset.labels,
            datasets: [{
              data: dataset.values,
              backgroundColor: colors,
              borderColor: '#fff',
              borderWidth: 2
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        };
      } else {
        config = {
          type: 'bar',
          data: {
            labels: dataset.labels,
            datasets: [{
              label: 'ตามประเภท',
              data: dataset.values,
              backgroundColor: colors,
              borderColor: colors.map(c => c.replace('0.8', '1')),
              borderWidth: 1
            }]
          },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
            }
        };
      }
    }
    
    new Chart(node.getContext('2d'), config);
  }

  function exportCSV() {
    exporting = true;
    try {
      const lines: string[] = [];
      const push = (arr: (string|number)[]) => lines.push(arr.map(v => typeof v === 'string' && v.includes(',') ? '"'+v.replace(/"/g,'""')+'"' : v).join(','));
      push(['Section','Label','Value']);
      // Summary
      push(['Summary','TotalAchievements', summaryStats.totalAchievements]);
      push(['Summary','MostActiveRole', summaryStats.mostActiveRole]);
      push(['Summary','MostPopularType', summaryStats.mostPopularType]);
      push(['Summary','AvgPerMonth', summaryStats.avgPerMonth]);
      // Roles
      roleData.labels.forEach((l,i)=> push(['Role', l, roleData.values[i]]));
      // Types
      typeData.labels.forEach((l,i)=> push(['Type', l, typeData.values[i]]));
      // Yearly
      yearlyData.forEach(y=> push(['Yearly', y.year, y.count]));
      // Academic Year Matrix (current filter)
      if (matrix.length) {
        push(['Matrix','Header','Type,ผู้บริหาร,ครู,นักเรียน,รวม']);
        matrix.forEach(row => push(['Matrix', row.type, `${row.roleCounts[0]},${row.roleCounts[1]},${row.roleCounts[2]},${row.total}`]));
      }
      // Deep Matrix (all academic years)
      deepMatrix.forEach(section => {
        push(['DeepMatrix', `AY-${section.academicYear}`, 'Type,ผู้บริหาร,ครู,นักเรียน,รวม']);
        section.rows.forEach(row => push(['DeepMatrix', `AY-${section.academicYear}`, `${row.type},${row.roleCounts[0]},${row.roleCounts[1]},${row.roleCounts[2]},${row.total}`]));
        push(['DeepMatrixTotals', `AY-${section.academicYear}`, `Totals,${section.totals[0]},${section.totals[1]},${section.totals[2]},${section.grand}`]);
      });
      growthData.forEach(g => push(['YoYGrowth', g.year, (Math.round(g.growth*10)/10)+'%']));
      if (deepMatrix.length) {
        const years = deepMatrix.map(s=>s.academicYear).sort();
        push(['WideMatrix','Header','Type,'+years.join(',')]);
        const typeSet = new Set<string>();
        deepMatrix.forEach(sec => sec.rows.forEach(r => typeSet.add(r.type)));
        Array.from(typeSet).forEach(t => {
          const rowVals = years.map(y => {
            const sec = deepMatrix.find(s=>s.academicYear===y);
            const r = sec?.rows.find(x=>x.type===t);
            return r? r.total : 0;
          });
          push(['WideMatrix', t, `${t},${rowVals.join(',')}`]);
        });
      }
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      a.download = `achievement-report-${now.toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      exporting = false;
    }
  }

  async function exportPDF() {
    exporting = true;
    try {
      // Lazy load PDF libraries only when user exports to reduce initial bundle
      const [{ default: jsPDF }, autoTableMod] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const title = 'รายงานสถิติผลงาน';
      doc.setFontSize(18);
      doc.text(title, 40, 40);
      doc.setFontSize(11);
      const generatedAt = new Date();
      doc.text(`สร้างเมื่อ: ${generatedAt.toLocaleString('th-TH')}`, 40, 60);
      // Summary table
      const summaryRows = [
        ['ผลงานทั้งหมด', summaryStats.totalAchievements.toString()],
        ['กลุ่มที่ใช้งานมากที่สุด', summaryStats.mostActiveRole],
        ['ประเภทที่นิยมที่สุด', summaryStats.mostPopularType],
        ['เฉลี่ยต่อเดือน', summaryStats.avgPerMonth.toString()]
      ];
      // @ts-ignore (autoTable augmentation)
      autoTableMod.default(doc, {
        startY: 80,
        head: [['สรุป', 'ค่า']],
        body: summaryRows,
        styles: { fontSize: 10, cellPadding: 4 }
      });
      let y = (doc as any).lastAutoTable.finalY + 20;
      // Role distribution
      const roleTable = roleData.labels.map((l,i)=> [l, roleData.values[i]]);
      // @ts-ignore
      autoTableMod.default(doc, { head: [['บทบาท','จำนวน']], body: roleTable, startY: y, styles:{ fontSize:10 } });
      y = (doc as any).lastAutoTable.finalY + 20;
      const typeTable = typeData.labels.map((l,i)=> [l, typeData.values[i]]);
      // @ts-ignore
      autoTableMod.default(doc, { head: [['ประเภท','จำนวน']], body: typeTable, startY: y, styles:{ fontSize:10 } });
      y = (doc as any).lastAutoTable.finalY + 20;
      if (matrix.length) {
        const matrixHead = ['ประเภท','ผู้บริหาร','ครู','นักเรียน','รวม'];
        const matrixBody = matrix.map(r => [r.type, ...r.roleCounts, r.total]);
        // @ts-ignore
        autoTableMod.default(doc, { head: [matrixHead], body: matrixBody, startY: y, styles:{ fontSize:9 } });
        y = (doc as any).lastAutoTable.finalY + 20;
      }
      if (yearlyData.length) {
        const yearlyHead = ['ปี', 'จำนวน'];
        const yearlyBody = yearlyData.map(r => [r.year, r.count]);
        // @ts-ignore
        autoTableMod.default(doc, { head: [yearlyHead], body: yearlyBody, startY: y, styles:{ fontSize:9 } });
      }
      doc.save(`achievement-report-${generatedAt.toISOString().slice(0,10)}.pdf`);
    } catch (e) {
      console.warn('PDF export failed', e);
      alert('ไม่สามารถสร้าง PDF ได้');
    } finally {
      exporting = false;
    }
  }

  $: if (selectedAcademicYear !== undefined || selectedOrgLevel !== undefined) {
    // Recompute matrix when filter changes; we need latest rows so re-run loadStats and then filter
    // Simpler: refetch all (small dataset <=500)
    if (!loading) loadStats();
  }

  function mountGrowthChart(node: HTMLCanvasElement) {
    if (!chartsReady || !Chart || growthData.length <= 1) return;
    new Chart(node.getContext('2d'), { type:'bar', data:{ labels:growthData.map(g=>g.year.toString()), datasets:[{ label:'% เติบโต', data:growthData.map(g=>Math.round(g.growth*10)/10), backgroundColor:growthData.map(g=> g.growth>=0?'rgba(34,197,94,0.8)':'rgba(239,68,68,0.8)') }] }, options:{ responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true, ticks:{ callback:(v:any)=> v+'%' } } } } });
  }
</script>

<div class="space-y-8">
  <div class="text-center">
  <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-orange-300">รายงาน & สถิติ</h2>
    <p class="text-gray-600 mt-2">สรุปข้อมูลผลงานและความสำเร็จทั้งหมด</p>
  </div>

  {#if loading}
    <div class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
      <p class="text-gray-500">กำลังโหลดข้อมูลสถิติ...</p>
    </div>
  {:else}
  <!-- Filters -->
    {#if academicYears.length > 0}
  <div class="flex flex-wrap items-center gap-4 mb-4">
        <label for="academicYearSelect" class="text-sm font-medium text-gray-700">ปีการศึกษา (พ.ศ.)</label>
        <select id="academicYearSelect" class="form-input w-40" bind:value={selectedAcademicYear}>
          <option value="">ทั้งหมด</option>
          {#each academicYears as ay}
            <option value={ay}>{ay}</option>
          {/each}
        </select>
        {#if selectedAcademicYear}
          <button class="text-xs text-red-500 hover:underline" on:click={() => selectedAcademicYear = ''}>ล้างตัวกรอง</button>
        {/if}
        <label for="orgLevelSelect" class="text-sm font-medium text-gray-700 ml-4">ระดับ</label>
        <select id="orgLevelSelect" class="form-input w-40" bind:value={selectedOrgLevel}>
          <option value="">ทั้งหมด</option>
          <option value="school">โรงเรียน</option>
          <option value="district">เขต</option>
          <option value="province">จังหวัด</option>
          <option value="region">ภาค</option>
          <option value="national">ประเทศ</option>
        </select>
        {#if selectedOrgLevel}
          <button class="text-xs text-red-500 hover:underline" on:click={() => selectedOrgLevel = ''}>ล้างระดับ</button>
        {/if}
      </div>
    {/if}
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
        <div class="text-3xl font-bold">{summaryStats.totalAchievements}</div>
        <div class="text-sm opacity-90">ผลงานทั้งหมด</div>
      </div>
      <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
        <div class="text-2xl font-bold">{summaryStats.mostActiveRole}</div>
        <div class="text-sm opacity-90">กลุ่มที่ใช้งานมากที่สุด</div>
      </div>
      <div class="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-lg shadow-lg">
        <div class="text-2xl font-bold">{summaryStats.mostPopularType}</div>
        <div class="text-sm opacity-90">ประเภทที่นิยมมากที่สุด</div>
      </div>
      <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
        <div class="text-3xl font-bold">{summaryStats.avgPerMonth}</div>
        <div class="text-sm opacity-90">เฉลี่ยต่อเดือน</div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="grid lg:grid-cols-2 gap-8">
      <div class="bg-white p-6 rounded-lg shadow-lg border h-80">
        <h3 class="text-xl font-semibold mb-4 text-gray-800">ผลงานตามบทบาท</h3>
        {#if chartsReady && roleData.values.some(v => v > 0)}
          <canvas use:mountChart={'role'} class="w-full h-full" />
        {:else if chartsReady}
          <p class="text-center text-gray-400 py-8">ยังไม่มีข้อมูลผลงาน</p>
        {:else}
          <p class="text-sm text-gray-400">กำลังเตรียมกราฟ...</p>
        {/if}
      </div>
      <div class="bg-white p-6 rounded-lg shadow-lg border h-80">
        <h3 class="text-xl font-semibold mb-4 text-gray-800">ผลงานตามประเภท</h3>
        {#if chartsReady && typeData.values.some(v => v > 0)}
          <canvas use:mountChart={'type'} class="w-full h-full" />
        {:else if chartsReady}
          <p class="text-center text-gray-400 py-8">ยังไม่มีข้อมูลผลงาน</p>
        {:else}
          <p class="text-sm text-gray-400">กำลังเตรียมกราฟ...</p>
        {/if}
      </div>
    </div>

    <!-- Yearly Trend Chart -->
    <!-- Role x Type Matrix -->
    {#if matrix.length}
      <div class="bg-white p-6 rounded-lg shadow-lg border overflow-auto">
        <h3 class="text-xl font-semibold mb-4 text-gray-800">ตารางสรุป บทบาท × ประเภท {#if selectedAcademicYear} (ปี {selectedAcademicYear}){/if}</h3>
        <table class="min-w-full border text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-2 text-left font-semibold border">ประเภท</th>
              <th class="px-3 py-2 font-semibold border">ผู้บริหาร</th>
              <th class="px-3 py-2 font-semibold border">ครู</th>
              <th class="px-3 py-2 font-semibold border">นักเรียน</th>
              <th class="px-3 py-2 font-semibold border">รวม</th>
            </tr>
          </thead>
          <tbody>
            {#each matrix as row}
              <tr class="hover:bg-gray-50">
                <td class="px-3 py-1 border">{row.type}</td>
                <td class="px-3 py-1 border text-center">{row.roleCounts[0]}</td>
                <td class="px-3 py-1 border text-center">{row.roleCounts[1]}</td>
                <td class="px-3 py-1 border text-center">{row.roleCounts[2]}</td>
                <td class="px-3 py-1 border text-center font-semibold">{row.total}</td>
              </tr>
            {/each}
            <tr class="bg-gray-100 font-semibold">
              <td class="px-3 py-1 border">รวมทั้งหมด</td>
              <td class="px-3 py-1 border text-center">{matrix.reduce((a,b)=>a+b.roleCounts[0],0)}</td>
              <td class="px-3 py-1 border text-center">{matrix.reduce((a,b)=>a+b.roleCounts[1],0)}</td>
              <td class="px-3 py-1 border text-center">{matrix.reduce((a,b)=>a+b.roleCounts[2],0)}</td>
              <td class="px-3 py-1 border text-center">{matrix.reduce((a,b)=>a+b.total,0)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    {/if}
  {#if yearlyData.length > 1}
      <div class="bg-white p-6 rounded-lg shadow-lg border">
        <h3 class="text-xl font-semibold mb-4 text-gray-800">แนวโน้มผลงานรายปี</h3>
        <div class="h-64">
          {#if chartsReady}
            <canvas use:mountChart={'yearly'} class="w-full h-full" />
          {:else}
            <p class="text-sm text-gray-400">กำลังเตรียมกราฟ...</p>
          {/if}
        </div>
      </div>
    {/if}
    {#if growthData.length > 1}
      <div class="bg-white p-6 rounded-lg shadow-lg border">
        <h3 class="text-xl font-semibold mb-4 text-gray-800">อัตราเติบโตปีต่อปี (%)</h3>
        <div class="h-64">
          {#if chartsReady}
            <canvas use:mountGrowthChart class="w-full h-full" />
          {:else}
            <p class="text-sm text-gray-400">กำลังเตรียมกราฟ...</p>
          {/if}
        </div>
      </div>
    {/if}
    {#if orgLevelDistribution.length}
    <div class="bg-white p-6 rounded-lg shadow-lg border">
      <h3 class="text-xl font-semibold mb-4 text-gray-800">การกระจายตามระดับองค์กร</h3>
      <table class="min-w-full border text-sm"><thead class="bg-gray-50"><tr><th class="px-3 py-2 text-left font-semibold border">ระดับ</th><th class="px-3 py-2 font-semibold border text-center">จำนวน</th></tr></thead><tbody>{#each orgLevelDistribution as row}<tr class="hover:bg-gray-50"><td class="px-3 py-1 border">{row.level}</td><td class="px-3 py-1 border text-center">{row.count}</td></tr>{/each}</tbody></table>
    </div>
    {/if}

    {#if deepMatrix.length}
      <div class="bg-white p-6 rounded-lg shadow-lg border overflow-auto">
        <h3 class="text-xl font-semibold mb-4 text-gray-800">Deep Matrix: ปีการศึกษา × ประเภท × บทบาท (สรุปรวม)</h3>
        {#each deepMatrix as section}
          <div class="mb-8">
            <h4 class="text-lg font-semibold mb-2">ปีการศึกษา {section.academicYear}</h4>
            <table class="min-w-full border text-sm mb-2">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left font-semibold border">ประเภท</th>
                  <th class="px-3 py-2 font-semibold border">ผู้บริหาร</th>
                  <th class="px-3 py-2 font-semibold border">ครู</th>
                  <th class="px-3 py-2 font-semibold border">นักเรียน</th>
                  <th class="px-3 py-2 font-semibold border">รวม</th>
                </tr>
              </thead>
              <tbody>
                {#each section.rows as row}
                  <tr class="hover:bg-gray-50">
                    <td class="px-3 py-1 border">{row.type}</td>
                    <td class="px-3 py-1 border text-center">{row.roleCounts[0]}</td>
                    <td class="px-3 py-1 border text-center">{row.roleCounts[1]}</td>
                    <td class="px-3 py-1 border text-center">{row.roleCounts[2]}</td>
                    <td class="px-3 py-1 border text-center font-semibold">{row.total}</td>
                  </tr>
                {/each}
                <tr class="bg-gray-100 font-semibold">
                  <td class="px-3 py-1 border">Totals</td>
                  <td class="px-3 py-1 border text-center">{section.totals[0]}</td>
                  <td class="px-3 py-1 border text-center">{section.totals[1]}</td>
                  <td class="px-3 py-1 border text-center">{section.totals[2]}</td>
                  <td class="px-3 py-1 border text-center">{section.grand}</td>
                </tr>
              </tbody>
            </table>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Export Options -->
    <div class="bg-gray-50 p-6 rounded-lg">
      <h3 class="text-lg font-semibold mb-4 text-gray-800">ตัวเลือกการส่งออก</h3>
      <div class="flex flex-wrap gap-4">
        <Button type="button" variant="secondary" size="sm" on:click={exportCSV} disabled={exporting} ariaLabel="ส่งออก CSV">
          {exporting ? '⏳ กำลังสร้าง CSV...' : '📊 ส่งออก CSV'}
        </Button>
        <Button type="button" variant="secondary" size="sm" on:click={exportPDF} disabled={exporting} ariaLabel="ส่งออก PDF">
          {exporting ? '⏳ กำลังสร้าง PDF...' : '📄 ส่งออก PDF'}
        </Button>
	  <Button type="button" variant="secondary" size="sm" on:click={() => window.print()} ariaLabel="พิมพ์รายงาน">
          🖨️ พิมพ์รายงาน
        </Button>
      </div>
    </div>
  {/if}
</div>

<style>
  canvas { max-width: 100%; }
</style>
