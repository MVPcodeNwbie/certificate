// Unified error code to user-friendly Thai message mapping
export type AppErrorCode =
  | 'RATE_LIMIT'
  | 'DUPLICATE'
  | 'SIMILAR'
  | 'SPAM'
  | 'VALIDATION'
  | 'UPLOAD_TOO_LARGE'
  | 'UNSUPPORTED_FILE'
  | 'SERVER'
  | 'NETWORK'
  | 'UNKNOWN';

const MAP: Record<AppErrorCode,string> = {
  RATE_LIMIT: 'ทำรายการถี่เกินไป กรุณารอสักครู่',
  DUPLICATE: 'มีรายการนี้อยู่แล้วเมื่อไม่นานนี้',
  SIMILAR: 'มีรายการชื่อใกล้เคียงมากอยู่แล้ว โปรดปรับชื่อให้ต่างขึ้น',
  SPAM: 'ข้อความเข้าข่ายสแปม โปรดปรับแก้',
  VALIDATION: 'ข้อมูลไม่ครบหรือไม่ถูกต้อง ตรวจสอบช่องที่จำเป็น',
  UPLOAD_TOO_LARGE: 'ไฟล์ใหญ่เกินกำหนด (สูงสุด 5MB ต่อไฟล์)',
  UNSUPPORTED_FILE: 'ชนิดไฟล์ไม่รองรับ (รองรับรูปภาพหรือ PDF)',
  SERVER: 'ระบบมีปัญหาชั่วคราว โปรดลองใหม่ภายหลัง',
  NETWORK: 'เครือข่ายขัดข้อง ตรวจสอบการเชื่อมต่อ',
  UNKNOWN: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
};

export function errorMessage(code: AppErrorCode | string | undefined, fallback?: string): string {
  if (!code) return fallback || MAP.UNKNOWN;
  return MAP[code as AppErrorCode] || fallback || MAP.UNKNOWN;
}

// Infer code from raw server error string when server not yet migrated to codes
export function inferCode(raw?: string): AppErrorCode {
  if (!raw) return 'UNKNOWN';
  if (/บ่อยเกิน|quota|429/.test(raw)) return 'RATE_LIMIT';
  if (/ซ้ำ/ .test(raw)) return 'DUPLICATE';
  if (/ใกล้เคียง/.test(raw)) return 'SIMILAR';
  if (/สแปม/i.test(raw)) return 'SPAM';
  if (/ข้อมูลที่จำเป็น|validation/i.test(raw)) return 'VALIDATION';
  if (/5MB|5 MB|ใหญ่เกิน/.test(raw)) return 'UPLOAD_TOO_LARGE';
  if (/ไม่รองรับ/.test(raw)) return 'UNSUPPORTED_FILE';
  if (/server error/i.test(raw)) return 'SERVER';
  return 'UNKNOWN';
}

export interface ApiErrorPayload { error?: string; errorCode?: AppErrorCode; }

export function mapApiError(payload: ApiErrorPayload): string {
  return errorMessage(payload.errorCode || inferCode(payload.error), payload.error);
}