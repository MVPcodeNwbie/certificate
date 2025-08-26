<script lang="ts">
import HeroSection from '$lib/presentation/components/HeroSection.svelte';
import FeatureGrid from '$lib/presentation/components/FeatureGrid.svelte';
import CategoryShowcase from '$lib/presentation/components/CategoryShowcase.svelte';
import AchievementCard from '$lib/presentation/components/AchievementCard.svelte';
import { AchievementFirebaseRepository } from '$lib/infrastructure/repositories/achievement-firebase-repo';
import { onMount } from 'svelte';
// Accept injected params (for route warnings suppression)
export let params: Record<string,string> | undefined; void params;

const featureData = [
	{ icon: '🏆', title: 'รวมทุกผลงาน', desc: 'เกียรติบัตร รางวัล การแข่งขัน อยู่รวมกันค้นหาง่าย' },
	{ icon: '🎓', title: 'วุฒิบัตรอบรม', desc: 'เก็บหลักฐานการพัฒนาตัวเองครบถ้วน' },
	{ icon: '⚡', title: 'ใช้งานง่าย', desc: 'เริ่มบันทึกได้ทันที ไม่ซับซ้อน' },
	{ icon: '🔍', title: 'ค้นหาไว', desc: 'พิมพ์ไม่กี่คำ ก็เจอสิ่งที่ต้องการ' },
	{ icon: '🗂️', title: 'จัดเป็นหมวด', desc: 'แบ่งประเภทชัดเจน หยิบใช้สะดวก' },
	{ icon: '🛡️', title: 'ข้อมูลปลอดภัย', desc: 'ออกแบบให้ลดความเสี่ยง ใช้งานสบายใจ' }
];

const categories = [
	{ icon: '🏆', label: 'รางวัล' },
	{ icon: '📜', label: 'เกียรติบัตร' },
	{ icon: '🎓', label: 'วุฒิบัตร' },
	{ icon: '🏃‍♂️', label: 'การแข่งขัน' },
	{ icon: '📚', label: 'การอบรม' },
	{ icon: '✨', label: 'อื่น ๆ' }
];

let latest: any[] = [];
let loadingLatest = true;
onMount(async () => {
	try {
		const repo = new AchievementFirebaseRepository();
		latest = await repo.list(6);
	} catch (e) { /* ignore */ }
	loadingLatest = false;
});
</script>

<div class="space-y-24">
	<HeroSection
		title="ระบบจัดเก็บผลงานของบุคลากร โรงเรียนวัดแสงสรรค์"
		primaryCta={{ label: 'บันทึกผลงาน', href: '/submit' }}
		secondaryCta={{ label: 'ดูรายการ', href: '/achievements' }}
	/>

	<!-- Quick navigation to all current sections -->
	<section class="max-w-6xl mx-auto px-4">
		<h2 class="sr-only">สำรวจระบบ</h2>
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<a href="/achievements" class="group p-4 rounded-xl border bg-white hover:shadow-md transition">
				<div class="text-2xl">📂</div>
				<p class="mt-2 font-semibold text-gray-900 group-hover:text-green-600">ผลงานทั้งหมด</p>
				<p class="text-xs text-gray-500 mt-1">เรียกดู & ค้นหา</p>
			</a>
			<a href="/submit" class="group p-4 rounded-xl border bg-white hover:shadow-md transition">
				<div class="text-2xl">➕</div>
				<p class="mt-2 font-semibold text-gray-900 group-hover:text-green-600">บันทึกผลงาน</p>
				<p class="text-xs text-gray-500 mt-1">เพิ่มไฟล์/ข้อมูล</p>
			</a>
			<a href="/hall-of-fame" class="group p-4 rounded-xl border bg-white hover:shadow-md transition">
				<div class="text-2xl">⭐</div>
				<p class="mt-2 font-semibold text-gray-900 group-hover:text-green-600">ผลงานเด่น</p>
				<p class="text-xs text-gray-500 mt-1">Hall of Fame</p>
			</a>
			<a href="/reports" class="group p-4 rounded-xl border bg-white hover:shadow-md transition">
				<div class="text-2xl">📊</div>
				<p class="mt-2 font-semibold text-gray-900 group-hover:text-green-600">รายงาน</p>
				<p class="text-xs text-gray-500 mt-1">สถิติ & การวิเคราะห์</p>
			</a>
		</div>
	</section>

	<FeatureGrid features={featureData} />

	<CategoryShowcase categories={categories} />

	<!-- Latest achievements preview -->
	<section class="mt-10">
		<div class="max-w-6xl mx-auto px-4">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-2xl font-bold text-gray-900">ผลงานล่าสุด</h2>
				<a href="/achievements" class="text-sm text-green-600 hover:text-green-700">ดูทั้งหมด →</a>
			</div>
			{#if loadingLatest}
				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					{#each Array(3) as _}
						<div class="animate-pulse h-64 rounded-xl border bg-white" />
					{/each}
				</div>
			{:else if latest.length === 0}
				<p class="text-sm text-gray-500">ยังไม่มีผลงาน ถูกบันทึก – เริ่มต้นบันทึกอันแรกได้เลย</p>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each latest as item}
						<a href={'/achievements/' + item.id} class="block">
							<AchievementCard
								title={item.title}
								ownerName={item.ownerName}
								ownerRole={item.ownerRole}
								issuer={item.issuer}
								date={item.date}
								type={item.type}
								fileUrl={item.fileUrl}
								evidence={item.evidence}
								url={item.url}
							/>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</section>

	<section class="mt-16 text-center">
		<p class="text-sm text-gray-500">เริ่มบันทึกผลงาน เพื่อให้การยกย่องและอ้างอิงทำได้รวดเร็วขึ้น</p>
	</section>
</div>
