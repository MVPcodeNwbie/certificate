export type Role = 'admin' | 'teacher' | 'student';
export type AchievementType =
	| 'certificate'
	| 'diploma'
	| 'award'
	| 'competition'
	| 'training'
	| 'other';

export interface FileEvidence {
	path: string;
	url: string;
	mimeType: string;
	name: string;
	size: number; // bytes
	isThumbnail?: boolean; // optional thumbnail marker
	blurDataUrl?: string; // optional tiny base64 blurred preview
}

export interface Achievement {
	id?: string;
	title: string;
	description?: string;
	issuer?: string; // ผู้ออกเกียรติบัตร ฯลฯ
	date?: string; // ISO date string
	ownerRole: Role;
	ownerName: string; // ชื่อผู้เกี่ยวข้อง
	type: AchievementType;
	url?: string; // ลิงก์อ้างอิงเพิ่มเติม
	// Org dimension
	orgLevel?: 'school' | 'district' | 'province' | 'region' | 'national';
	orgNames?: string[];
	// Semantic tags (derived – thai tokenization / simple segmentation)
	tags?: string[];
	// Engagement placeholder (future ready – will be populated by projection or user interactions)
	views?: number;
	likes?: number;
	// Legacy single file fields (คงไว้เพื่อ backward compatibility กับ UI/การ์ด)
	filePath?: string; // ที่อยู่ใน Firebase Storage (first evidence)
	fileUrl?: string; // public URL (first evidence)
	evidence?: FileEvidence[]; // หลายไฟล์หลักฐาน
	createdAt: number; // epoch ms
	updatedAt: number; // epoch ms
	// Training / diploma specific (optional)
	trainingHours?: number; // จำนวนชั่วโมง
	trainingBenefits?: string; // ประโยชน์ที่ได้รับ
	trainingNextActions?: string; // การดำเนินการต่อ/การขยายผล
	// Award / Competition / Other specifics
	awardLevel?: string; // ระดับ/รางวัลที่ได้รับ (ที่ 1, ดีเยี่ยม ฯลฯ)
	competitionCategory?: string; // ประเภทการแข่งขัน
	otherSpecified?: string; // รายละเอียดเมื่อเลือกประเภท other
}
