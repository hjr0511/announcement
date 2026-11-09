import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';
import { RoleType } from '../types';
import { authenticateAdmin, isDemoMode } from '../config/appMode';
import { logAuditEvent } from '../utils/security';

interface Props {
  onLoginSuccess: (role: Exclude<RoleType, 'student'>, displayName: string) => void;
  onBackToStudent: () => void;
}

export const AdminLogin: React.FC<Props> = ({ onLoginSuccess, onBackToStudent }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const demo = isDemoMode();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const account = authenticateAdmin(username, password);
    if (!account) {
      setErrorMessage('帳號或密碼不正確');
      logAuditEvent({
        operatorRole: 'system_admin',
        operatorName: '未授權嘗試',
        targetStudentId: '處室登入',
        targetStudentName: '行政入口',
        action: '登入驗證',
        securityLevel: '關鍵變更',
        details: `處室登入失敗（帳號：${username.trim() || '(空白)'}）`,
      });
      return;
    }

    logAuditEvent({
      operatorRole: account.role,
      operatorName: account.displayName,
      targetStudentId: '校務處室管理台',
      targetStudentName: '全體學生',
      action: '登入驗證',
      securityLevel: '常規',
      details: `${account.displayName} 以帳號 ${account.username} 登入行政後台`,
    });
    onLoginSuccess(account.role, account.displayName);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 px-6 py-5 text-white">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <h1 className="font-bold text-lg">處室行政登入</h1>
          </div>
          <p className="text-emerald-100 text-xs mt-1">高雄市立中正高工 · 教務／學務／系統管理</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">帳號</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="例如：academic"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">密碼</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="請輸入處室密碼"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-start space-x-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold flex items-center justify-center space-x-2"
          >
            <Lock className="w-4 h-4" />
            <span>登入行政後台</span>
          </button>

          <button
            type="button"
            onClick={onBackToStudent}
            className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 inline-flex items-center justify-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回學生查詢登入</span>
          </button>

          {demo && (
            <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
              <div className="font-bold flex items-center space-x-1">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Demo 提示帳號</span>
              </div>
              <p>academic / CcvsAcad113（教務）</p>
              <p>studentaffairs / CcvsStu113（學務）</p>
              <p>admin / CcvsAdmin113（系統）</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
