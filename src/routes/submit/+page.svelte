<script lang="ts">
import Button from '$lib/presentation/components/Button.svelte';
	import { beforeNavigate } from '$app/navigation';
	import type { Achievement, AchievementType, Role } from '$lib/domain/achievement';
	import { optimizeImage } from '$lib/utils/image';
	import { AchievementFirebaseRepository } from '$lib/infrastructure/repositories/achievement-firebase-repo';
	import { CreateAchievement } from '$lib/application/usecases';
	import { mapApiError, errorMessage } from '$lib/presentation/errors/map';
	export let params: Record<string,string> | undefined; void params;

	let form: Partial<Achievement> = { ownerRole: 'student' as Role, type: 'certificate' as AchievementType, orgLevel: 'school' };
	let formAny: any = form; // alias for extra fields
	let files: File[] = [];
	let sending = false;
	let uploadProgress = 0;
	let perFileMessages: { name: string; optimized?: boolean; }[] = [];
	let message = '';
	let lastErrorCode: string | null = null; // track standardized error vs success

	// Wizard state
	let activeTab = 0; const TOTAL_TABS = 4; let touched = false; const originalSnapshot = JSON.stringify(form);
	function markTouched(){ touched = true; }
	function progressPercent(){ return Math.round((activeTab)/(TOTAL_TABS-1)*100); }
	function nextTab(){ if (activeTab < TOTAL_TABS-1) activeTab++; }
	function prevTab(){ if (activeTab > 0) activeTab--; }
	beforeNavigate(nav=>{ if (sending) return; if (touched && JSON.stringify(form)!==originalSnapshot){ if(!confirm('มีข้อมูลที่ยังไม่บันทึก ออกจากหน้านี้หรือไม่?')) nav.cancel(); }});

	function validateCurrentTab(): string | null {
		if (activeTab===0){ if (!form.title || !form.ownerName || !form.ownerRole || !form.type) return 'กรุณากรอกข้อมูลที่จำเป็น'; }
		if (activeTab===3){ if (!files.length) return 'กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์'; }
		return null;
	}

	async function finalizeSubmit(){
		message='';
		lastErrorCode=null;
		if (form.title) form.title=form.title.trim();
		if (form.ownerName) form.ownerName=form.ownerName.trim();
		if (form.description) form.description=form.description.slice(0,2000).trim();
		if (form.issuer) form.issuer=form.issuer.trim();
		if (form.url) form.url=form.url.trim();
		if (form.url==='') delete (form as any).url;
		if (form.description==='') delete (form as any).description;
		if (form.issuer==='') delete (form as any).issuer;
		sending=true; uploadProgress=0;
		try {
			const processed: File[] = []; perFileMessages=[];
			for (const f of files){
				if (f.size>5*1024*1024){ message=errorMessage('UPLOAD_TOO_LARGE'); lastErrorCode='UPLOAD_TOO_LARGE'; sending=false; return; }
				if (!/(image\/.*|application\/pdf)/.test(f.type)){ message=errorMessage('UNSUPPORTED_FILE'); lastErrorCode='UNSUPPORTED_FILE'; sending=false; return; }
				if (f.type.startsWith('image/')){ const optimized=await optimizeImage(f,{thumbnail:true}); processed.push(optimized.originalFile); if(optimized.thumbnailFile) processed.push(optimized.thumbnailFile); perFileMessages.push({name:f.name, optimized:optimized.wasOptimized}); }
				else { processed.push(f); perFileMessages.push({name:f.name}); }
			}
			const repo=new AchievementFirebaseRepository();
			const usecase=new CreateAchievement(repo);
			let id: string | undefined;
			try {
				let orgNames: string[] | undefined;
				if (formAny.orgNamesRaw) { orgNames = formAny.orgNamesRaw.split(',').map((s:string)=>s.trim()).filter(Boolean).slice(0,5); }
				id=await usecase.exec({ title:form.title!, ownerRole:form.ownerRole!, ownerName:form.ownerName!, type:form.type!, description:form.description, issuer:form.issuer, date:form.date, url:form.url, orgLevel: form.orgLevel!, orgNames, createdAt:0, updatedAt:0 } as any, processed, p=>uploadProgress=p);
			} catch(err:any){
				// Firestore or network error (client-side). Provide generic message.
				console.error('Create usecase error', err);
				message=errorMessage('SERVER'); lastErrorCode='SERVER';
				throw err; // ensure outer finally executes
			}
			if (id){
				message=`บันทึกสำเร็จ! (ID: ${id})`;
				form={ ownerRole:'student', type:'certificate', orgLevel:'school' } as any; formAny=form; files=[]; uploadProgress=0; touched=false; activeTab=0;
			}
		} catch(e){ console.error(e); if(!message){ message=errorMessage('SERVER'); lastErrorCode='SERVER'; } } finally { sending=false; }
	}

	function nextOrSubmit(){ const err=validateCurrentTab(); if (err){ message=err; return; } if (activeTab < TOTAL_TABS-1){ message=''; nextTab(); } else { finalizeSubmit(); } }
</script>

<div class="max-w-4xl mx-auto">
	<div class="card">
		<div class="px-6 py-5 gradient-brand-soft">
			<h2 class="text-2xl font-bold text-green-950">บันทึกข้อมูลความสำเร็จ</h2>
			<p class="text-green-950/80 mt-1">เพิ่มผลงาน รางวัล หรือความสำเร็จใหม่เข้าสู่ระบบ</p>
			<!-- Progress dots -->
			<div class="mt-5 flex items-center gap-3">
				{#each Array(TOTAL_TABS) as _, i}
					<div class="relative flex items-center">
						<div class="w-3 h-3 rounded-full transition-all duration-300 {i<=activeTab ? 'bg-green-500 scale-100' : 'bg-green-500/20 scale-75'}"></div>
						{#if i < TOTAL_TABS-1}
							<div class="w-10 h-[2px] mx-1 rounded bg-green-500/20 overflow-hidden">
								<div class="h-full bg-green-500 origin-left transition-all duration-500" style="width:{i < activeTab ? '100%' : i === activeTab ? progressPercent()+'%' : '0%'}"></div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
			<div class="text-xs text-green-950/70 mt-2">ขั้นตอน {activeTab+1} / {TOTAL_TABS}</div>
		</div>
		<div class="px-6 pt-4 flex flex-wrap gap-2 border-b border-gray-200 bg-white/40 backdrop-blur-sm">
			{#each ['ข้อมูลทั่วไป','ระดับพื้นที่','ระยะเวลา','หลักฐาน'] as label, i}
				<button type="button" class="px-3 py-2 rounded-md text-sm font-medium transition-colors {i===activeTab ? 'bg-white text-green-900 shadow' : 'text-green-900/60 hover:text-green-900 bg-white/50'}" on:click={() => activeTab = i}>{i+1}. {label}</button>
			{/each}
		</div>
		<form on:submit|preventDefault={nextOrSubmit} class="p-6 space-y-6">
			{#if activeTab === 0}
			<div class="grid grid-cols-1 gap-6" on:input={markTouched}>
				<div>
					<label for="title" class="form-label">ชื่อเรื่อง <span class="text-red-500">*</span></label>
					<input id="title" class="form-input" bind:value={form.title} required minlength={1} maxlength={150} placeholder="เช่น เกียรติบัตรการแข่งขันคณิตศาสตร์" />
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label for="owner-role" class="form-label">บทบาท <span class="text-red-500">*</span></label>
						<select id="owner-role" class="form-input" bind:value={form.ownerRole}>
							<option value="admin">👨‍💼 ผู้บริหาร</option>
							<option value="teacher">👨‍🏫 ครู</option>
							<option value="student">👨‍🎓 นักเรียน</option>
						</select>
					</div>
					<div>
						<label for="owner-name" class="form-label">ชื่อผู้เกี่ยวข้อง <span class="text-red-500">*</span></label>
						<input id="owner-name" class="form-input" bind:value={form.ownerName} required maxlength={120} placeholder="ชื่อ-สกุล" />
					</div>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label for="type" class="form-label">ประเภท <span class="text-red-500">*</span></label>
						<select id="type" class="form-input" bind:value={form.type}>
							<option value="certificate">📜 เกียรติบัตร</option>
							<option value="diploma">🎓 วุฒิบัตร</option>
							<option value="award">🏆 รางวัล</option>
							<option value="competition">🏃‍♂️ การแข่งขัน</option>
							<option value="training">📚 การอบรม</option>
							<option value="other">✨ อื่น ๆ</option>
						</select>
					</div>
					<div>
						<label for="date" class="form-label">วันที่</label>
						<input id="date" type="date" class="form-input" bind:value={form.date} />
					</div>
				</div>
				<div>
					<label for="issuer" class="form-label">ผู้ออก/หน่วยงาน</label>
					<input id="issuer" class="form-input" bind:value={form.issuer} placeholder="เช่น กระทรวงศึกษาธิการ, มหาวิทยาลัยเชียงใหม่" />
				</div>
				<div>
					<label for="description" class="form-label">รายละเอียดเพิ่มเติม</label>
					<textarea id="description" rows="4" class="form-textarea" maxlength="2000" bind:value={form.description} placeholder="อธิบายเพิ่มเติมเกี่ยวกับความสำเร็จนี้..."></textarea>
				</div>
				{#if form.type === 'training' || form.type === 'diploma'}
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
						<div>
							<label for="training-hours" class="form-label">จำนวนชั่วโมง</label>
							<input id="training-hours" type="number" min="0" max="1000" class="form-input" bind:value={formAny.trainingHours} placeholder="เช่น 12" />
							<p class="text-xs text-gray-500 mt-1">ชั่วโมงรวมของหลักสูตร</p>
						</div>
						<div class="md:col-span-2 space-y-6">
							<div>
								<label for="training-benefits" class="form-label">ประโยชน์ที่ได้รับ</label>
								<textarea id="training-benefits" rows="3" class="form-textarea" maxlength="1500" bind:value={formAny.trainingBenefits} placeholder="สรุปสิ่งที่ได้รับหรือทักษะที่เพิ่มขึ้น"></textarea>
							</div>
							<div>
								<label for="training-next" class="form-label">การดำเนินการต่อ / การขยายผล</label>
								<textarea id="training-next" rows="3" class="form-textarea" maxlength="1500" bind:value={formAny.trainingNextActions} placeholder="จะนำไปประยุกต์ใช้อย่างไร หรือขั้นตอนถัดไป"></textarea>
							</div>
						</div>
					</div>
				{/if}
				{#if form.type === 'award'}
					<div>
						<label for="award-level" class="form-label">รางวัลที่ได้รับ (ถ้ามี)</label>
						<input id="award-level" class="form-input" bind:value={formAny.awardLevel} placeholder="เช่น ที่ 1, เหรียญทอง, ดีเยี่ยม, เข้าร่วม" />
					</div>
				{/if}
				{#if form.type === 'competition'}
					<div>
						<label for="competition-category" class="form-label">ประเภทการแข่งขัน (ถ้ามี)</label>
						<input id="competition-category" class="form-input" bind:value={formAny.competitionCategory} placeholder="เช่น ศิลปหัตถกรรม, วิชาการ, กีฬา" />
					</div>
				{/if}
				{#if form.type === 'other'}
					<div>
						<label for="other-specified" class="form-label">โปรดระบุ (อื่น ๆ)</label>
						<input id="other-specified" class="form-input" bind:value={formAny.otherSpecified} placeholder="อธิบายประเภทผลงาน" />
					</div>
				{/if}
			</div>
			{/if}
			{#if activeTab === 1}
				<div class="space-y-6" on:input={markTouched}>
					<div>
						<label class="form-label" for="org-level">ระดับ</label>
						<select id="org-level" class="form-input" bind:value={formAny.orgLevel}>
							<option value="school">โรงเรียน</option>
							<option value="district">เขต</option>
							<option value="province">จังหวัด</option>
							<option value="region">ภาค</option>
							<option value="national">ประเทศ</option>
						</select>
					</div>
					<div>
						<label class="form-label" for="org-names">ชื่อองค์กร/หน่วยงาน (คั่นด้วย ,)</label>
						<input id="org-names" class="form-input" bind:value={formAny.orgNamesRaw} placeholder="โรงเรียนตัวอย่าง, กลุ่มสาระคณิตศาสตร์" />
						<p class="text-xs text-gray-500 mt-1">ระบบจะตัดเกิน 5 ชื่ออัตโนมัติ</p>
					</div>
				</div>
			{/if}
			{#if activeTab === 2}
				<div class="space-y-6" on:input={markTouched}>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label class="form-label" for="start-date">วันที่เริ่มต้น</label>
							<input id="start-date" type="date" class="form-input" bind:value={formAny.startDate} />
						</div>
						<div>
							<label class="form-label" for="end-date">วันที่สิ้นสุด</label>
							<input id="end-date" type="date" class="form-input" bind:value={formAny.endDate} />
						</div>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label class="form-label" for="academic-year">ปีการศึกษา</label>
							<input id="academic-year" class="form-input" placeholder="2568" bind:value={formAny.academicYear} />
						</div>
						<div>
							<label class="form-label" for="term">ภาคเรียน (ถ้ามี)</label>
							<select id="term" class="form-input" bind:value={formAny.term}>
								<option value="">-</option>
								<option value="1">1</option>
								<option value="2">2</option>
							</select>
						</div>
					</div>
					<p class="text-xs text-gray-500">ระบบสามารถ derive ปีการศึกษาหากกรอกเฉพาะวันที่</p>
				</div>
			{/if}
			{#if activeTab === 3}
				<div class="space-y-6" on:input={markTouched}>
					<div>
						<label for="file" class="form-label">แนบไฟล์ (หลายไฟล์ได้, รูปภาพหรือ PDF, ≤ 5MB/ไฟล์)</label>
						<div class="mt-2">
							<input id="file" type="file" multiple accept="image/*,application/pdf" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer" on:change={(e)=>{const list=e.currentTarget?.files; files= list? Array.from(list): []; markTouched();}} />
							<p class="text-xs text-gray-500 mt-1">รองรับไฟล์ JPG, PNG, PDF (เลือกหลายไฟล์ได้)</p>
						</div>
					</div>
					{#if files.length}
						<div class="space-y-2">
							<p class="text-sm font-medium text-gray-700">ไฟล์ที่เลือก ({files.length}):</p>
							<ul class="space-y-1 text-sm text-gray-600 max-h-40 overflow-auto border rounded-md p-2 bg-gray-50">
								{#each files as f, i}
									<li class="flex items-center justify-between"><span class="truncate max-w-xs" title={f.name}>{i+1}. {f.name} <span class="text-xs text-gray-400">({Math.round(f.size/1024)} KB)</span></span><button type="button" class="text-red-500 hover:text-red-600 text-xs" on:click={() => { files = files.filter(x => x !== f); markTouched(); }}>&times;</button></li>
								{/each}
							</ul>
							{#if perFileMessages.length}
								<div class="text-xs text-green-600 space-y-0.5">{#each perFileMessages as m}<div>- {m.name}{m.optimized ? ' (optimized)' : ''}</div>{/each}</div>
							{/if}
						</div>
					{/if}
					<div>
						<label for="url" class="form-label">ลิงก์อ้างอิง (ถ้ามี)</label>
						<input id="url" class="form-input" bind:value={form.url} placeholder="https://example.com" type="url" />
					</div>
				</div>
			{/if}
			<div class="flex items-center justify-between pt-6 border-t border-gray-200">
				{#if sending && uploadProgress>0}
					<div class="flex-1 mr-4">
						<div class="text-sm text-gray-600 mb-2">กำลังอัปโหลด... {uploadProgress}%</div>
						<div class="w-full bg-gray-200 rounded-full h-2"><div class="bg-gradient-to-r from-green-300 to-orange-300 h-2 rounded-full transition-all duration-300" style="width:{uploadProgress}%"></div></div>
					</div>
				{:else}
					<div class="space-x-2">
						<button type="button" class="text-gray-600 hover:text-gray-800" on:click={() => {
							form = { ownerRole:'student', type:'certificate'};
							formAny = form;
							files = [];
							message = '';
							touched = false;
							activeTab = 0;
						}}>รีเซ็ต</button>
						{#if activeTab>0}<Button type="button" variant="secondary" size="md" on:click={prevTab}>ย้อนกลับ</Button>{/if}
					</div>
				{/if}
				<Button type="submit" disabled={sending} variant={activeTab===TOTAL_TABS-1 ? 'primary':'primary'} size="lg">
					{#if sending}
						<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>กำลังบันทึก...
					{:else}
						{activeTab===TOTAL_TABS-1?'บันทึกข้อมูล':'ถัดไป'}
					{/if}
				</Button>
			</div>
		</form>
	</div>
	
	{#if message}
		<div class="mt-6">
			{#if lastErrorCode}
				<div class="bg-red-50 border border-red-200 rounded-md p-4">
					<div class="flex">
						<div class="flex-shrink-0">
							<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
						</div>
						<div class="ml-3"><p class="text-red-800 whitespace-pre-wrap">{message}</p></div>
					</div>
				</div>
			{:else}
				<div class="bg-green-50 border border-green-200 rounded-md p-4">
					<div class="flex">
						<div class="flex-shrink-0"><svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg></div>
						<div class="ml-3">
							<p class="text-green-800 whitespace-pre-wrap">{message}</p>
							<div class="mt-3"><a href="/achievements" class="text-sm text-green-600 hover:text-green-500 font-medium">ดูรายการทั้งหมด →</a></div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
