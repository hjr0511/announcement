import { RoleType } from '../types';

/**
 * 正式模式（預設）：必須登入，隱藏一鍵切換身分
 * Demo 模式：VITE_DEMO_MODE=true 時開放測試身分切換
 */
export function isDemoMode(): boolean {
  return String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase() === 'true';
}

export interface AdminAccount {
  username: string;
  password: string;
  role: Exclude<RoleType, 'student'>;
  displayName: string;
}

/** 處室帳號（前端靜態站僅作基本門檻；正式環境建議改接學校 SSO） */
export function getAdminAccounts(): AdminAccount[] {
  return [
    {
      username: 'academic',
      password: import.meta.env.VITE_ADMIN_ACADEMIC_PASS || 'CcvsAcad113',
      role: 'academic_affairs',
      displayName: '教務處註冊組',
    },
    {
      username: 'studentaffairs',
      password: import.meta.env.VITE_ADMIN_STUDENT_PASS || 'CcvsStu113',
      role: 'student_affairs',
      displayName: '學務處生輔組',
    },
    {
      username: 'admin',
      password: import.meta.env.VITE_ADMIN_SYSTEM_PASS || 'CcvsAdmin113',
      role: 'system_admin',
      displayName: '系統與資安管理員',
    },
  ];
}

export function authenticateAdmin(
  username: string,
  password: string
): AdminAccount | null {
  const u = username.trim().toLowerCase();
  const p = password;
  return (
    getAdminAccounts().find(
      (a) => a.username.toLowerCase() === u && a.password === p
    ) || null
  );
}
