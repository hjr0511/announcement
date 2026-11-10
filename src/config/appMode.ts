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
  enabled?: boolean;
}

const ROLE_ALIASES: Record<string, Exclude<RoleType, 'student'>> = {
  academic_affairs: 'academic_affairs',
  academic: 'academic_affairs',
  教務: 'academic_affairs',
  教務處: 'academic_affairs',
  student_affairs: 'student_affairs',
  studentaffairs: 'student_affairs',
  學務: 'student_affairs',
  學務處: 'student_affairs',
  system_admin: 'system_admin',
  admin: 'system_admin',
  系統: 'system_admin',
  系統管理: 'system_admin',
  系統管理員: 'system_admin',
};

export function normalizeAdminRole(
  raw: string | undefined | null
): Exclude<RoleType, 'student'> | null {
  const key = String(raw || '')
    .trim()
    .toLowerCase();
  return ROLE_ALIASES[key] || null;
}

/** 程式／環境變數預設處室帳號（試算表無資料或本機模式時使用） */
export function getDefaultAdminAccounts(): AdminAccount[] {
  return [
    {
      username: 'academic',
      password: import.meta.env.VITE_ADMIN_ACADEMIC_PASS || 'CcvsAcad113',
      role: 'academic_affairs',
      displayName: '教務處註冊組',
      enabled: true,
    },
    {
      username: 'studentaffairs',
      password: import.meta.env.VITE_ADMIN_STUDENT_PASS || 'CcvsStu113',
      role: 'student_affairs',
      displayName: '學務處生輔組',
      enabled: true,
    },
    {
      username: 'admin',
      password: import.meta.env.VITE_ADMIN_SYSTEM_PASS || 'CcvsAdmin113',
      role: 'system_admin',
      displayName: '系統與資安管理員',
      enabled: true,
    },
  ];
}

/** @deprecated 請改用 getDefaultAdminAccounts；保留別名相容舊程式 */
export function getAdminAccounts(): AdminAccount[] {
  return getDefaultAdminAccounts();
}

export function normalizeAdminAccounts(
  list: AdminAccount[] | undefined | null
): AdminAccount[] {
  if (!Array.isArray(list) || list.length === 0) {
    return getDefaultAdminAccounts();
  }

  const normalized = list
    .map((a) => {
      const username = String(a?.username || '').trim();
      const password = String(a?.password || '');
      const role = normalizeAdminRole(a?.role);
      const displayName = String(a?.displayName || '').trim() || username;
      const enabled = a?.enabled === false ? false : true;
      if (!username || !password || !role) return null;
      return { username, password, role, displayName, enabled } as AdminAccount;
    })
    .filter((a): a is AdminAccount => !!a);

  return normalized.length > 0 ? normalized : getDefaultAdminAccounts();
}

export function authenticateAdmin(
  username: string,
  password: string,
  accounts?: AdminAccount[] | null
): AdminAccount | null {
  const u = username.trim().toLowerCase();
  const p = password;
  const pool = normalizeAdminAccounts(accounts);
  return (
    pool.find(
      (a) =>
        a.enabled !== false &&
        a.username.toLowerCase() === u &&
        a.password === p
    ) || null
  );
}
