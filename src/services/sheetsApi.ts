import {
  StudentProfile,
  UploadedDocument,
  AuditLogEntry,
} from '../types';

export interface SheetsBundle {
  students: StudentProfile[];
  documents: UploadedDocument[];
  auditLogs: AuditLogEntry[];
}

export type SheetsSyncStatus =
  | 'idle'
  | 'loading'
  | 'saving'
  | 'connected'
  | 'local'
  | 'error';

const API_URL = (import.meta.env.VITE_SHEETS_API_URL as string | undefined)?.trim() || '';

/** 是否已設定試算表 API（未設定則走本機 mock / localStorage） */
export function isSheetsEnabled(): boolean {
  return Boolean(API_URL);
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

  const json = await res.json();
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
  const json = await res.json();
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
    // 部分部署環境 GET 參數不穩，改用 POST
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

export async function saveToSheets(bundle: SheetsBundle): Promise<void> {
  await postJson({ action: 'saveAll', data: bundle });
}

export async function seedSheets(bundle: SheetsBundle): Promise<void> {
  await postJson({ action: 'seed', data: bundle });
}

function normalizeBundle(data: SheetsBundle | undefined): SheetsBundle {
  return {
    students: Array.isArray(data?.students) ? data!.students : [],
    documents: Array.isArray(data?.documents) ? data!.documents : [],
    auditLogs: Array.isArray(data?.auditLogs) ? data!.auditLogs : [],
  };
}
