// Domain Value Objects & Validation (single source)
import type { Achievement } from './achievement';

export type Role = 'admin' | 'teacher' | 'student';
export const ROLES: Role[] = ['admin', 'teacher', 'student'];

export type AchievementType =
  | 'certificate'
  | 'diploma'
  | 'award'
  | 'competition'
  | 'training'
  | 'other';
export const ACHIEVEMENT_TYPES: AchievementType[] = [
  'certificate',
  'diploma',
  'award',
  'competition',
  'training',
  'other'
];

export class Title {
  private constructor(private readonly value: string) {}
  static create(raw: unknown): Title {
    if (typeof raw !== 'string' || raw.trim().length < 1 || raw.trim().length > 150) {
      throw new Error('ชื่อเรื่องต้องมีความยาว 1-150 ตัวอักษร');
    }
    return new Title(raw.trim());
  }
  toString() { return this.value; }
}

export class OwnerName {
  private constructor(private readonly value: string) {}
  static create(raw: unknown): OwnerName {
    if (typeof raw !== 'string' || raw.trim().length < 2 || raw.trim().length > 120) {
      throw new Error('ชื่อผู้เกี่ยวข้องต้องมีความยาว 2-120 ตัวอักษร');
    }
    return new OwnerName(raw.trim());
  }
  toString() { return this.value; }
}

export class RoleType {
  private constructor(private readonly value: Role) {}
  static create(raw: unknown): RoleType {
    if (raw !== 'admin' && raw !== 'teacher' && raw !== 'student') {
      throw new Error('บทบาทไม่ถูกต้อง');
    }
    return new RoleType(raw);
  }
  toString() { return this.value; }
}

export class AchievementCategory {
  private constructor(private readonly value: AchievementType) {}
  static create(raw: unknown): AchievementCategory {
    if (!ACHIEVEMENT_TYPES.includes(raw as any)) {
      throw new Error('ประเภทผลงานไม่ถูกต้อง');
    }
    return new AchievementCategory(raw as AchievementType);
  }
  toString() { return this.value; }
}

export class UrlRef {
  private constructor(private readonly value: string) {}
  static create(raw: unknown): UrlRef {
    if (raw === undefined || raw === null || raw === '') return new UrlRef('');
    if (typeof raw !== 'string' || !/^https?:\/\//.test(raw)) {
      throw new Error('ลิงก์ต้องขึ้นต้นด้วย http(s)://');
    }
    if (raw.length > 500) throw new Error('ลิงก์ยาวเกิน 500 ตัวอักษร');
    return new UrlRef(raw);
  }
  toString() { return this.value; }
}

export class AcademicYear {
  private constructor(private readonly value: number) {}
  
  static create(dateString?: string): AcademicYear | null {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    
    // Thai academic year: May-April (พฤษภาคม-เมษายน)
    // If month >= 5 (May onwards), it's the start of new academic year
    // If month < 5 (Jan-Apr), it's the end of previous academic year that started last year
    const academicYear = month >= 5 ? year : year - 1;
    
    return new AcademicYear(academicYear + 543); // Convert to Buddhist Era
  }
  
  static fromBuddhistYear(buddhistYear: number): AcademicYear {
    if (buddhistYear < 2500 || buddhistYear > 2600) {
      throw new Error('ปีการศึกษาต้องอยู่ระหว่าง พ.ศ. 2500-2600');
    }
    return new AcademicYear(buddhistYear);
  }
  
  toString(): string { return this.value.toString(); }
  toNumber(): number { return this.value; }
}

export class DateRange {
  private constructor(
    private readonly startDate: string,
    private readonly endDate?: string
  ) {}
  
  static create(startDate?: string, endDate?: string): DateRange | null {
    if (!startDate) return null;
    
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      throw new Error('วันที่เริ่มต้นไม่ถูกต้อง');
    }
    
    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        throw new Error('วันที่สิ้นสุดไม่ถูกต้อง');
      }
      if (end <= start) {
        throw new Error('วันที่สิ้นสุดต้องมาหลังวันที่เริ่มต้น');
      }
    }
    
    return new DateRange(startDate, endDate);
  }
  
  getStartDate(): string { return this.startDate; }
  getEndDate(): string | undefined { return this.endDate; }
  
  getAcademicYear(): AcademicYear | null {
    return AcademicYear.create(this.startDate);
  }
}

export interface DomainAchievementProps {
  title: Title;
  ownerRole: RoleType;
  ownerName: OwnerName;
  type: AchievementCategory;
  description?: string;
  issuer?: string;
  date?: string; // ISO
  url?: UrlRef;
  filePath?: string;
  fileUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export class DomainAchievement {
  constructor(public readonly id: string | undefined, private readonly props: DomainAchievementProps) {}
  toPersistence(): Record<string, any> {
    const { title, ownerRole, ownerName, type, url, ...rest } = this.props;
    return {
      ...rest,
      title: title.toString(),
      ownerRole: ownerRole.toString(),
      ownerName: ownerName.toString(),
      type: type.toString(),
      url: url?.toString() || ''
    };
  }
}

// Central validation used by UI + API
export interface ValidationResult { ok: boolean; errors: string[]; value?: Partial<Achievement>; }

export class DomainValidationError extends Error {
  constructor(public readonly errors: string[]) { super(errors.join('\n')); }
}

export function validateAchievement(data: Partial<Achievement>, opts: { isUpdate?: boolean } = {}): ValidationResult {
  const errors: string[] = [];
  const DESCRIPTION_MAX = 2000; // align with Firestore rules
  const required = ['title','ownerRole','ownerName','type','orgLevel'] as const;
  if (!opts.isUpdate) {
    for (const k of required) {
      if (!(data as any)[k]) errors.push(`กรุณากรอก ${translateField(k)}`);
    }
  }
  
  // Field-level checks
  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.trim().length < 1 || data.title.trim().length > 150) {
      errors.push('ชื่อเรื่องต้องมีความยาว 1-150 ตัวอักษร');
    }
  }
  if (data.ownerName !== undefined) {
    if (typeof data.ownerName !== 'string' || data.ownerName.trim().length < 2 || data.ownerName.trim().length > 120) {
      errors.push('ชื่อผู้เกี่ยวข้องต้องมีความยาว 2-120 ตัวอักษร');
    }
  }
  if (data.ownerRole !== undefined) {
    if (!ROLES.includes(data.ownerRole as any)) errors.push('บทบาทไม่ถูกต้อง');
  }
  if (data.type !== undefined) {
    if (!ACHIEVEMENT_TYPES.includes(data.type as any)) errors.push('ประเภทไม่ถูกต้อง');
  }
  if (data.orgLevel !== undefined) {
    const lv = ['school','district','province','region','national'];
    if (!lv.includes(data.orgLevel as any)) errors.push('ระดับองค์กรไม่ถูกต้อง');
  }
  if (data.orgNames !== undefined) {
    if (!Array.isArray(data.orgNames)) errors.push('orgNames ต้องเป็น list');
    else {
      if (data.orgNames.length > 5) errors.push('orgNames ไม่เกิน 5 รายการ');
      for (const n of data.orgNames) { if (typeof n !== 'string' || !n.trim()) { errors.push('orgNames มีค่าว่าง'); break; } if (n.length>120){ errors.push('orgNames ยาวเกิน 120'); break; } }
    }
  }
  if (data.url) {
    if (!/^https?:\/\//.test(data.url)) errors.push('ลิงก์ต้องขึ้นต้นด้วย http(s)://');
    if (data.url.length > 500) errors.push('ลิงก์ยาวเกิน 500 ตัวอักษร');
  }
  if (data.description && data.description.length > DESCRIPTION_MAX) errors.push(`รายละเอียดต้องไม่เกิน ${DESCRIPTION_MAX} ตัวอักษร`);
  if (data.issuer && data.issuer.length > 200) errors.push('ผู้ออกเกียรติบัตรต้องไม่เกิน 200 ตัวอักษร');
  if (data.trainingHours !== undefined) {
    if (typeof data.trainingHours !== 'number' || data.trainingHours < 0 || data.trainingHours > 1000) {
      errors.push('จำนวนชั่วโมงการอบรมต้องเป็นตัวเลข 0-1000');
    }
  }
  if (data.trainingBenefits !== undefined && data.trainingBenefits.length > 1500) {
    errors.push('ประโยชน์ที่ได้รับต้องไม่เกิน 1500 ตัวอักษร');
  }
  if (data.trainingNextActions !== undefined && data.trainingNextActions.length > 1500) {
    errors.push('การดำเนินการต่อ/การขยายผลต้องไม่เกิน 1500 ตัวอักษร');
  }
  if (data.awardLevel !== undefined && data.awardLevel.length > 300) {
    errors.push('รางวัลที่ได้รับต้องไม่เกิน 300 ตัวอักษร');
  }
  if (data.competitionCategory !== undefined && data.competitionCategory.length > 300) {
    errors.push('ประเภทการแข่งขันต้องไม่เกิน 300 ตัวอักษร');
  }
  if (data.otherSpecified !== undefined && data.otherSpecified.length > 300) {
    errors.push('โปรดระบุ (อื่น ๆ) ต้องไม่เกิน 300 ตัวอักษร');
  }
  
  // Cross-field validation using Domain Value Objects
  try {
    // Validate date range logic if date is provided
    if (data.date) {
      const dateRange = DateRange.create(data.date);
      if (!dateRange) {
        errors.push('วันที่ไม่ถูกต้อง');
      } else {
        // Check if date is not too far in the future
        const providedDate = new Date(data.date);
        const now = new Date();
        const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        
        if (providedDate > oneYearFromNow) {
          errors.push('วันที่ไม่ควรเกิน 1 ปีในอนาคต');
        }
        
        // Add academic year info to validation result (for UI display)
        const academicYear = dateRange.getAcademicYear();
        if (academicYear && data.title) {
          // Could add business rule: certain types should match academic calendar
        }
      }
    }
    
    // Domain-specific business rules
    if (data.type === 'competition' && !data.issuer) {
      // Competitions usually have organizing bodies
      // This is a soft warning, not an error
    }
    
  // description now fully optional for every type (removed minimum length rule for certificate)
    
  } catch (domainError: any) {
    errors.push(domainError.message);
  }
  
  return { ok: errors.length === 0, errors, value: errors.length ? undefined : data };
}

function translateField(field: string): string {
  switch (field) {
    case 'title': return 'ชื่อเรื่อง';
    case 'ownerRole': return 'บทบาท';
    case 'ownerName': return 'ชื่อผู้เกี่ยวข้อง';
    case 'type': return 'ประเภท';
  case 'orgLevel': return 'ระดับองค์กร';
    default: return field;
  }
}
