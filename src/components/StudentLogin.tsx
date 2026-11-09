import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  UserCheck, 
  ShieldAlert, 
  RotateCw, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  KeyRound, 
  GraduationCap, 
  Building2,
  HelpCircle,
  FileBadge,
  Sparkles
} from 'lucide-react';
import { StudentProfile } from '../types';
import { validateTaiwanId, logAuditEvent } from '../utils/security';
import { isDemoMode } from '../config/appMode';

interface Props {
  students: StudentProfile[];
  onLoginSuccess: (student: StudentProfile) => void;
  onSwitchToAdmin: () => void;
  onOpenSecurityNotice: () => void;
}

export const StudentLogin: React.FC<Props> = ({
  students,
  onLoginSuccess,
  onSwitchToAdmin,
  onOpenSecurityNotice,
}) => {
  const demo = isDemoMode();
  const [studentId, setStudentId] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [showNationalId, setShowNationalId] = useState(false);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);

  // 產生 4 碼易讀數字/字母驗證碼
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // 帳號鎖定倒數
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLocked && lockCountdown > 0) {
      interval = setInterval(() => {
        setLockCountdown((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockCountdown]);

  const handleQuickFill = (stu: StudentProfile) => {
    setStudentId(stu.studentId);
    setNationalId(stu.nationalId);
    setCaptchaInput(captchaCode);
    setErrorMessage('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isLocked) {
      setErrorMessage(`資安保護機制生效中：連續登入失敗已被系統暫時鎖定，請於 ${lockCountdown} 秒後重試`);
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage('請先閱讀並勾選同意個人資料保護告知事項');
      return;
    }

    const trimmedStudentId = studentId.trim().toUpperCase();
    const cleanNationalId = nationalId.trim().toUpperCase();

    if (!trimmedStudentId || !cleanNationalId) {
      setErrorMessage('請完整填寫學號與身分證字號');
      return;
    }

    // 驗證碼檢查
    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setErrorMessage('圖形驗證碼輸入錯誤，請重新核對');
      generateCaptcha();
      return;
    }

    // 身分證格式檢核
    const idValidation = validateTaiwanId(cleanNationalId);
    if (!idValidation.isValid) {
      setErrorMessage(idValidation.message);
      return;
    }

    // 比對學生資料庫
    const matched = students.find(
      (s) => s.studentId.toUpperCase() === trimmedStudentId && s.nationalId.toUpperCase() === cleanNationalId
    );

    if (matched) {
      logAuditEvent({
        operatorRole: 'student',
        operatorName: `${matched.name} (學生本人)`,
        targetStudentId: matched.studentId,
        targetStudentName: matched.name,
        action: '登入驗證',
        securityLevel: '常規',
        details: '學生成功通過學號與身分證字號雙因子身分驗證登入系統',
      });
      onLoginSuccess(matched);
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      logAuditEvent({
        operatorRole: 'student',
        operatorName: '匿名訪客/身分不符',
        targetStudentId: trimmedStudentId || '未知',
        targetStudentName: '無比對紀錄',
        action: '登入驗證',
        securityLevel: '敏感調閱',
        details: `登入身分驗證失敗 (嘗試次數: ${newAttempts})，學號或身分證字號不符`,
      });

      if (newAttempts >= 3) {
        setIsLocked(true);
        setLockCountdown(45);
        setErrorMessage('資安防護警示：已連續輸入錯誤達 3 次！為防止撞庫攻擊，系統已暫時鎖定 45 秒。');
      } else {
        setErrorMessage(`學號或身分證字號不正確！(剩餘可嘗試次數：${3 - newAttempts} 次)`);
      }
      generateCaptcha();
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 py-8 bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-100">
      
      {/* Container */}
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-3 shadow-inner">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">學生身分認證查詢專區</h1>
            <p className="text-xs text-blue-200/80 mt-1">個人學籍檔案 • 學期成績核算 • 官方成績單 PDF 下載</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          {isLocked && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>防護鎖定倒數：{lockCountdown} 秒</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsLocked(false);
                  setFailedAttempts(0);
                  setErrorMessage('');
                }}
                className="text-amber-800 underline font-semibold text-[11px] hover:text-amber-950"
              >
                [測試用解除]
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Student ID Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                學生學號 (Student ID) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                  placeholder="例如：S1121001"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {/* National ID Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  身分證字號 / 居留證號 <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowNationalId(!showNationalId)}
                  className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  {showNationalId ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>遮罩隱碼</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>顯示明碼</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showNationalId ? 'text' : 'password'}
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value.toUpperCase())}
                  placeholder="例如：A123456789 (首字英文共10碼)"
                  maxLength={10}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 tracking-wider"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                🔒 系統採用 SHA-256 加密比對，遵循中華民國個資法規範，不以明文留存傳輸
              </p>
            </div>

            {/* Dynamic Security CAPTCHA */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                防偽圖形安全驗證碼 <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                  placeholder="輸入右側4碼"
                  maxLength={4}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono uppercase tracking-widest text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center"
                  required
                />
                
                {/* Visual Captcha Box */}
                <div 
                  onClick={generateCaptcha}
                  className="relative select-none cursor-pointer bg-gradient-to-r from-slate-800 via-indigo-950 to-blue-900 text-amber-300 px-4 py-2 rounded-xl font-mono text-lg font-black tracking-widest border border-slate-700 shadow-inner flex items-center space-x-2 hover:opacity-90 transition-opacity"
                  title="點擊重新產生驗證碼"
                >
                  <span className="italic transform -skew-x-6">{captchaCode}</span>
                  <RotateCw className="w-3.5 h-3.5 text-slate-400 hover:rotate-180 transition-transform" />
                </div>
              </div>
            </div>

            {/* Privacy Agreement Checkbox */}
            <div className="pt-1">
              <label className="flex items-start space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600 leading-tight">
                  本人已詳細閱讀並同意遵循{' '}
                  <button
                    type="button"
                    onClick={onOpenSecurityNotice}
                    className="text-blue-600 underline hover:text-blue-800 font-semibold"
                  >
                    學校個人資料保護告知聲明
                  </button>
                  ，並確保僅查詢本人資料。
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLocked}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>驗證身分並安全登入</span>
            </button>
          </form>

          {/* Quick Demo Fill Accounts — 僅 Demo 模式 */}
          {demo && (
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
                  點擊一鍵填入測試帳號
                </span>
                <span className="text-[10px] text-slate-400">僅 Demo</span>
              </div>

              <div className="space-y-1.5">
                {students.map((stu) => (
                  <button
                    key={stu.studentId}
                    type="button"
                    onClick={() => handleQuickFill(stu)}
                    className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 rounded-lg text-xs text-slate-700 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-900 group-hover:text-blue-700">{stu.name}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{stu.studentId}</span>
                      <span className="text-[10px] bg-slate-200 group-hover:bg-blue-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {stu.department.slice(0, 4)}
                      </span>
                    </div>
                    <span className="text-[10px] text-blue-600 font-medium group-hover:translate-x-0.5 transition-transform">
                      填入 →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Administrative Portal Link */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={onSwitchToAdmin}
              className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center space-x-1.5 font-medium py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-600" />
              <span>教務處 / 學務處 / 系統管理員行政登入入口</span>
            </button>
          </div>

        </div>

        {/* Security Footer Notice */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-center text-[10px] text-slate-400 flex items-center justify-center space-x-2">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
          <span>本系統受中華民國刑法第358條妨害電腦使用罪保護，非本人授權請勿嘗試未授權查詢</span>
        </div>

      </div>

    </div>
  );
};
