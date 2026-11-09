import React from 'react';
import { Cloud, CloudOff, Loader2, RefreshCw, UploadCloud, AlertTriangle } from 'lucide-react';
import { SheetsSyncStatus } from '../services/sheetsApi';

interface Props {
  status: SheetsSyncStatus;
  message?: string;
  sheetsEnabled: boolean;
  onReload: () => void;
  onSeed: () => void;
  showSeed: boolean;
}

export const DataSyncBanner: React.FC<Props> = ({
  status,
  message,
  sheetsEnabled,
  onReload,
  onSeed,
  showSeed,
}) => {
  if (!sheetsEnabled) {
    return (
      <div className="bg-slate-800 text-slate-200 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CloudOff className="w-3.5 h-3.5 text-slate-400" />
          <span>
            目前使用本機資料（mock + localStorage）。若要改接 Google 試算表，請在 `.env.local` 設定
            <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-700 text-amber-200">VITE_SHEETS_API_URL</code>
          </span>
        </div>
      </div>
    );
  }

  const isBusy = status === 'loading' || status === 'saving';

  return (
    <div
      className={`text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 ${
        status === 'error'
          ? 'bg-rose-700 text-white'
          : status === 'connected'
          ? 'bg-emerald-800 text-emerald-50'
          : 'bg-sky-900 text-sky-50'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {status === 'error' ? (
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        ) : isBusy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        ) : (
          <Cloud className="w-3.5 h-3.5 shrink-0" />
        )}
        <span className="truncate">
          {message ||
            (status === 'loading'
              ? '正在從 Google 試算表載入資料…'
              : status === 'saving'
              ? '正在同步寫回試算表…'
              : status === 'error'
              ? '試算表連線失敗，請檢查 Apps Script 網址與部署權限'
              : '已連線 Google 試算表（處室可直接在表中維護，學生端重新載入即可查詢）')}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {showSeed && (
          <button
            type="button"
            onClick={onSeed}
            disabled={isBusy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/15 hover:bg-white/25 disabled:opacity-50"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>寫入範例資料</span>
          </button>
        )}
        <button
          type="button"
          onClick={onReload}
          disabled={isBusy}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/15 hover:bg-white/25 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} />
          <span>重新載入</span>
        </button>
      </div>
    </div>
  );
};
