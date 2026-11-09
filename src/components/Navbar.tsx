import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  ShieldCheck, 
  Lock, 
  User, 
  Building2, 
  LogOut, 
  Menu, 
  X, 
  RotateCw, 
  ChevronDown,
  Sparkles,
  Clock
} from 'lucide-react';
import { RoleType, StudentProfile } from '../types';

interface Props {
  currentRole: RoleType;
  currentStudent: StudentProfile | null;
  onRoleChange: (role: RoleType, studentId?: string) => void;
  onLogout: () => void;
  onOpenSecurityNotice: () => void;
  allStudents: StudentProfile[];
}

export const Navbar: React.FC<Props> = ({
  currentRole,
  currentStudent,
  onRoleChange,
  onLogout,
  onOpenSecurityNotice,
  allStudents
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  
  // 15 分鐘安全倒數計時模擬 (Session timeout timer)
  const [secondsLeft, setSecondsLeft] = useState(900); // 15 mins

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 900));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'student':
        return { label: '學生查詢端', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: GraduationCap };
      case 'academic_affairs':
        return { label: '教務處 (學籍成績組)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Building2 };
      case 'student_affairs':
        return { label: '學務處 (生活輔導組)', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Building2 };
      case 'system_admin':
        return { label: '系統管理 (資安稽核)', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: ShieldCheck };
      default:
        return { label: '訪客', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: User };
    }
  };

  const roleInfo = getRoleBadge();
  const RoleIcon = roleInfo.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & School Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onRoleChange(currentRole, currentStudent?.studentId)}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">高雄市立中正高工</span>
                <span className="hidden sm:inline-block text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                  校務整合雲
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">學生學籍成績查詢與多處室行政管理系統</p>
            </div>
          </div>

          {/* Desktop Security Indicators & Role Switcher */}
          <div className="hidden lg:flex items-center space-x-4">
            
            {/* Security Notice Button */}
            <button
              onClick={onOpenSecurityNotice}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              title="查看資安法規與個人資料保護規範"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>資安合規 A 級</span>
            </button>

            {/* Session Timeout Counter */}
            <div 
              className="flex items-center space-x-1.5 px-2.5 py-1 text-xs text-slate-600 bg-slate-100 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors"
              onClick={() => setSecondsLeft(900)}
              title="點擊重置安全連線倒數時間"
            >
              <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span className="font-mono text-slate-700 font-medium">{formatTime(secondsLeft)}</span>
              <RotateCw className="w-3 h-3 text-slate-400 hover:rotate-180 transition-transform" />
            </div>

            {/* Role Switcher Dropdown (Easy Demo Testing for User) */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${roleInfo.color} hover:brightness-95`}
              >
                <RoleIcon className="w-4 h-4" />
                <span>{roleInfo.label}</span>
                {currentRole === 'student' && currentStudent && (
                  <span className="font-semibold text-slate-800">
                    : {currentStudent.name} ({currentStudent.studentId})
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
              </button>

              {roleDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn"
                  onMouseLeave={() => setRoleDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    切換測試身分 (體驗權限劃分)
                  </div>
                  
                  {/* Students */}
                  <div className="px-3 pt-2 pb-1 text-xs font-bold text-slate-700">學生身分查詢端：</div>
                  {allStudents.map((stu) => (
                    <button
                      key={stu.studentId}
                      onClick={() => {
                        onRoleChange('student', stu.studentId);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-1.5 text-xs flex items-center justify-between hover:bg-blue-50 transition-colors ${
                        currentRole === 'student' && currentStudent?.studentId === stu.studentId
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-slate-700'
                      }`}
                    >
                      <span>{stu.name} ({stu.studentId})</span>
                      <span className="text-[10px] text-slate-400">{stu.department.slice(0, 4)}</span>
                    </button>
                  ))}

                  <div className="my-1 border-t border-slate-100"></div>
                  
                  {/* Departments */}
                  <div className="px-3 pt-2 pb-1 text-xs font-bold text-slate-700">校務處室管理端：</div>
                  <button
                    onClick={() => {
                      onRoleChange('academic_affairs');
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-1.5 text-xs flex items-center space-x-2 hover:bg-emerald-50 transition-colors ${
                      currentRole === 'academic_affairs' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>教務處 (學籍成績/匯入審核)</span>
                  </button>

                  <button
                    onClick={() => {
                      onRoleChange('student_affairs');
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-1.5 text-xs flex items-center space-x-2 hover:bg-amber-50 transition-colors ${
                      currentRole === 'student_affairs' ? 'bg-amber-50 text-amber-800 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>學務處 (生活輔導/獎懲/審件)</span>
                  </button>

                  <button
                    onClick={() => {
                      onRoleChange('system_admin');
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-1.5 text-xs flex items-center space-x-2 hover:bg-purple-50 transition-colors ${
                      currentRole === 'system_admin' ? 'bg-purple-50 text-purple-800 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>系統管理處 (資安稽核/日誌)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="安全登出系統"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${roleInfo.color} flex items-center space-x-1.5`}>
              <RoleIcon className="w-3.5 h-3.5" />
              <span>{roleInfo.label}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-slate-500 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>連線倒數 {formatTime(secondsLeft)}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">切換身分</div>
            {allStudents.map((s) => (
              <button
                key={s.studentId}
                onClick={() => {
                  onRoleChange('student', s.studentId);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between ${
                  currentRole === 'student' && currentStudent?.studentId === s.studentId
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-50 text-slate-700'
                }`}
              >
                <span>學生：{s.name} ({s.studentId})</span>
                <span className="text-[10px] opacity-80">{s.department}</span>
              </button>
            ))}

            <div className="pt-2"></div>
            <button
              onClick={() => {
                onRoleChange('academic_affairs');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 ${
                currentRole === 'academic_affairs' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>教務處 (學籍成績管理)</span>
            </button>

            <button
              onClick={() => {
                onRoleChange('student_affairs');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 ${
                currentRole === 'student_affairs' ? 'bg-amber-600 text-white' : 'bg-slate-50 text-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>學務處 (生活輔導與獎懲)</span>
            </button>

            <button
              onClick={() => {
                onRoleChange('system_admin');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 ${
                currentRole === 'system_admin' ? 'bg-purple-600 text-white' : 'bg-slate-50 text-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>系統管理處 (資安稽核日誌)</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => {
                onOpenSecurityNotice();
                setMobileMenuOpen(false);
              }}
              className="text-xs text-blue-600 font-medium flex items-center space-x-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>個資法規宣告</span>
            </button>
            <button
              onClick={() => {
                onLogout();
                setMobileMenuOpen(false);
              }}
              className="px-3 py-1.5 text-xs text-rose-600 bg-rose-50 rounded-lg font-medium flex items-center space-x-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>登出</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
