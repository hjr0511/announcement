import {
  StudentProfile,
  UploadedDocument,
  AuditLogEntry,
} from '../types';
import { AdminAccount, normalizeAdminAccounts } from '../config/appMode';

export interface SheetsBundle {
  students: StudentProfile[];
  documents: UploadedDocument[];
  auditLogs: AuditLogEntry[];
  adminAccounts: AdminAccount[];
}

export type SheetsSyncStatus =
  | 'idle'
  | 'loading'
  | 'saving'
  | 'connected'
  | 'local'
  | 'error';

/**
 * 學校 Workspace 網址：
 *   https://script.google.com/a/macros/xxx.edu.tw/s/ID/exec
 * 對外呼叫建議改成：
 *   https://script.google.com/macros/s/ID/exec
 */
function normalizeSheetsUrl(raw: string): string {
  const url = raw.trim().replace(/\/+$/, '');
  if (!url) return '';
  const m = url.match(
    /^https:\/\/script\.google\.com\/a\/macros\/[^/]+\/s\/([^/]+)\/exec\/?$/i
  );
  if (m) {
    return `https://script.google.com/macros/s/${m[1]}/exec`;
  }
  return url;
}

const API_URL = normalizeSheetsUrl(
  (import.meta.env.VITE_SHEETS_API_URL as string | undefined) || ''
);

/** 是否已設定試算表 API（未設定則走本機 mock / localStorage） */
export function isSheetsEnabled(): boolean {
  return Boolean(API_URL);
}

export function getSheetsApiUrl(): string {
  return API_URL;
}

async function postJson<T>(payload: unknown): Promise<T> {
  if (!API_URL) {
    throw new Error('尚未設定 VITE_SHEETS_API_URL');
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    // text/plain 可避免瀏覽器對 Apps Script 發 CORS preflight
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`試算表 API HTTP ${res.status}`);
  }

  const text = await res.text();
  if (text.trim().startsWith('<!DOCTYPE') || text.includes('Sign in - Google Accounts')) {
    throw new Error(
      'Apps Script 需要登入（權限未設成「任何人」）。請重新部署：執行身分=我、存取權=任何人'
    );
  }

  let json: { ok?: boolean; error?: string };
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('試算表 API 回傳不是 JSON，請確認部署網址與權限');
  }
  if (!json.ok) {
    throw new Error(json.error || '試算表 API 回傳失敗');
  }
  return json as T;
}

async function getJson<T>(action: string): Promise<T> {
  if (!API_URL) {
    throw new Error('尚未設定 VITE_SHEETS_API_URL');
  }

  const url = `${API_URL}${API_URL.includes('?') ? '&' : '?'}action=${encodeURIComponent(action)}`;
  const res = await fetch(url, { method: 'GET', redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`試算表 API HTTP ${res.status}`);
  }

  const text = await res.text();
  if (text.trim().startsWith('<!DOCTYPE') || text.includes('Sign in - Google Accounts')) {
    throw new Error(
      'Apps Script 需要登入（權限未設成「任何人」）。請重新部署：執行身分=我、存取權=任何人'
    );
  }

  let json: { ok?: boolean; error?: string };
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('試算表 API 回傳不是 JSON，請確認部署網址與權限');
  }
  if (!json.ok) {
    throw new Error(json.error || '試算表 API 回傳失敗');
  }
  return json as T;
}

export async function pingSheets(): Promise<boolean> {
  try {
    await getJson<{ ok: boolean }>('ping');
    return true;
  } catch {
    try {
      await postJson<{ ok: boolean }>({ action: 'getAll' });
      return true;
    } catch {
      return false;
    }
  }
}

export async function loadFromSheets(): Promise<SheetsBundle> {
  try {
    const json = await getJson<{ ok: boolean; data: SheetsBundle }>('getAll');
    return normalizeBundle(json.data);
  } catch {
    const json = await postJson<{ ok: boolean; data: SheetsBundle }>({ action: 'getAll' });
    return normalizeBundle(json.data);
  }
}

/**
 * 寫回試算表。預設不覆寫「稽核日誌」工作表（replaceAuditLogs=false）。
 * 需搭配已更新的 Apps Script；若尚未重新部署，仍會帶上 bundle.auditLogs 以相容舊版。
 */
export async function saveToSheets(
  bundle: SheetsBundle,
  opts?: { replaceAuditLogs?: boolean }
): Promise<void> {
  await postJson({
    action: 'saveAll',
    data: {
      ...bundle,
      replaceAuditLogs: opts?.replaceAuditLogs === true,
    },
  });
}

export async function seedSheets(bundle: SheetsBundle): Promise<void> {
  await postJson({
    action: 'seed',
    data: { ...bundle, replaceAuditLogs: true },
  });
}

/** 只追加新的稽核列，不清空、不覆寫工作表既有紀錄 */
export async function appendAuditLogs(
  logs: SheetsBundle['auditLogs']
): Promise<void> {
  if (!logs.length) return;
  await postJson({ action: 'appendAudit', logs });
}

function normalizeBundle(data: SheetsBundle | undefined): SheetsBundle {
  return {
    students: Array.isArray(data?.students) ? data!.students : [],
    documents: Array.isArray(data?.documents) ? data!.documents : [],
    auditLogs: Array.isArray(data?.auditLogs) ? data!.auditLogs : [],
    adminAccounts: normalizeAdminAccounts(data?.adminAccounts),
  };
}
