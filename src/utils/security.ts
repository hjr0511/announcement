import { AuditLogEntry, RoleType } from '../types';

/**
 * 臺灣身分證字號檢核邏輯 (ROC National ID Checksum)
 */
export function validateTaiwanId(id: string): { isValid: boolean; message: string } {
  if (!id) return { isValid: false, message: '請輸入身分證字號' };
  const cleanId = id.trim().toUpperCase();
  
  // 格式：第 1 碼英文字母，第 2 碼為 1(男) 或 2(女) 或居留證 8/9，後面 8 碼數字
  const regex = /^[A-Z][1289]\d{8}$/;
  if (!regex.test(cleanId)) {
    return { isValid: false, message: '身分證字號格式不符 (首字英文字母，共10碼)' };
  }

  // 字母對應數值代碼 (A=10, B=11, ..., Z=33)
  const letterMap: Record<string, number> = {
    A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, J: 18, K: 19,
    L: 20, M: 21, N: 22, P: 23, Q: 24, R: 25, S: 26, T: 27, U: 28, V: 29,
    X: 30, Y: 31, W: 32, Z: 33, I: 34, O: 35
  };

  const firstChar = cleanId[0];
  const num = letterMap[firstChar];
  if (!num) return { isValid: false, message: '無效的開頭縣市字母代碼' };

  // 加權檢查碼演算法:
  // 首字兩位數 X1, X2: X1 + 9*X2
  // 後續 8 碼乘以 8,7,6,5,4,3,2,1
  // 最後加上檢驗碼 D10
  // 總和必須能被 10 整除
  const x1 = Math.floor(num / 10);
  const x2 = num % 10;
  let sum = x1 + x2 * 9;

  for (let i = 1; i <= 8; i++) {
    sum += parseInt(cleanId[i], 10) * (9 - i);
  }
  const checkDigit = parseInt(cleanId[9], 10);
  sum += checkDigit;

  if (sum % 10 !== 0) {
    return { isValid: false, message: '身分證檢核碼計算不相符，請核對輸入' };
  }

  return { isValid: true, message: '身分證檢核正確' };
}

/**
 * 個資隱碼/遮罩處理 (遵循個人資料保護法規範)
 */
export function maskNationalId(id: string): string {
  if (!id || id.length < 10) return id;
  // 保留前3碼與後3碼，中間4碼遮蔽為 ****，例如 A12****789
  return `${id.substring(0, 3)}****${id.substring(7)}`;
}

export function maskPhone(phone: string): string {
  if (!phone) return '';
  // 0912-345-678 -> 0912-***-678 或 0912***678
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `${clean.substring(0, 4)}-***-${clean.substring(7)}`;
  }
  return phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
}

export function maskAddress(address: string): string {
  if (!address) return '';
  // 保留縣市鄉鎮市區，路街號等遮蔽
  if (address.length > 9) {
    return address.substring(0, 6) + '＊＊＊＊＊＊' + address.substring(address.length - 2);
  }
  return address.substring(0, 3) + '＊＊＊＊';
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0]}*@${domain}`;
  return `${name.substring(0, 2)}***${name.substring(name.length - 1)}@${domain}`;
}

/**
 * 產生動態防偽驗證碼
 */
export function generateVerificationCode(studentId: string, semesterId: string): string {
  const salt = 'NSTU-ACAD-VERIFY-2026';
  const str = `${studentId}-${semesterId}-${salt}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `VER-${hex.substring(0, 4)}-${hex.substring(4, 8)}-${studentId.slice(-3)}`;
}

/**
 * 本地端安全稽核日誌儲存
 */
const AUDIT_STORAGE_KEY = 'school_portal_audit_logs';

export function getAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'ipAddress' | 'deviceInfo'>): void {
  try {
    const currentLogs = getAuditLogs();
    const newEntry: AuditLogEntry = {
      id: 'LOG-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6).toUpperCase(),
      timestamp: new Date().toLocaleString('zh-TW', { hour12: false }),
      ipAddress: '140.112.88.24 (校園內部/VPN連線)',
      deviceInfo: navigator.userAgent.includes('Mobile') ? '行動裝置 (Mobile Browser)' : '桌面端瀏覽器 (Chrome/Safari/Edge)',
      ...entry,
    };
    const updated = [newEntry, ...currentLogs].slice(0, 150); // 保留最新150筆
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}
