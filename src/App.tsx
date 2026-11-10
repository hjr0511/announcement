import React, { useState, useEffect, useRef } from 'react';
import { 
  StudentProfile, 
  RoleType, 
  AuditLogEntry, 
  UploadedDocument 
} from './types';
import { 
  INITIAL_STUDENTS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_DOCUMENTS 
} from './data/mockData';
import { getAuditLogs, logAuditEvent } from './utils/security';
import {
  isSheetsEnabled,
  loadFromSheets,
  saveToSheets,
  seedSheets,
  SheetsSyncStatus,
} from './services/sheetsApi';
import { Navbar } from './components/Navbar';
import { StudentLogin } from './components/StudentLogin';
import { StudentPortal } from './components/StudentPortal';
import { AdminPortal } from './components/AdminPortal';
import { AdminLogin } from './components/AdminLogin';
import { SecurityNoticeModal } from './components/SecurityNoticeModal';
import { DataSyncBanner } from './components/DataSyncBanner';
import {
  AdminAccount,
  getDefaultAdminAccounts,
  isDemoMode,
  normalizeAdminAccounts,
} from './config/appMode';
import { ShieldCheck, PhoneCall } from 'lucide-react';

const AUDIT_STORAGE_KEY = 'school_portal_audit_logs';
const ADMIN_ACCOUNTS_STORAGE_KEY = 'school_portal_admin_accounts';
const sheetsEnabled = isSheetsEnabled();
const demoMode = isDemoMode();

function loadLocalAdminAccounts(): AdminAccount[] {
  try {
    const saved = localStorage.getItem(ADMIN_ACCOUNTS_STORAGE_KEY);
    if (saved) return normalizeAdminAccounts(JSON.parse(saved));
  } catch {
    /* ignore */
  }
  return getDefaultAdminAccounts();
}

export default function App() {
  const [students, setStudents] = useState<StudentProfile[]>(() => {
    if (sheetsEnabled) return [];
    try {
      const saved = localStorage.getItem('nstu_students_data');
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [currentRole, setCurrentRole] = useState<RoleType>('student');
  const [currentStudent, setCurrentStudent] = useState<StudentProfile | null>(null);
  const [isStudentLoggedIn, setIsStudentLoggedIn] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [authView, setAuthView] = useState<'student' | 'admin'>('student');
  const [adminDisplayName, setAdminDisplayName] = useState('');
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>(() =>
    sheetsEnabled ? getDefaultAdminAccounts() : loadLocalAdminAccounts()
  );

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    if (sheetsEnabled) return [];
    const saved = getAuditLogs();
    return saved.length > 0 ? saved : INITIAL_AUDIT_LOGS;
  });

  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>(() => {
    if (sheetsEnabled) return [];
    try {
      const saved = localStorage.getItem('nstu_uploaded_docs');
      return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  });

  const [isSecurityNoticeOpen, setIsSecurityNoticeOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SheetsSyncStatus>(
    sheetsEnabled ? 'loading' : 'local'
  );
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [showSeed, setShowSeed] = useState(false);
  const [ready, setReady] = useState(!sheetsEnabled);

  // 避免初次載入就立刻回寫覆蓋試算表
  const skipNextSave = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyBundle = (bundle: {
    students: StudentProfile[];
    documents: UploadedDocument[];
    auditLogs: AuditLogEntry[];
    adminAccounts?: AdminAccount[];
  }) => {
    setStudents(bundle.students);
    setUploadedDocs(bundle.documents);
    setAuditLogs(bundle.auditLogs);
    setAdminAccounts(normalizeAdminAccounts(bundle.adminAccounts));
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(bundle.auditLogs));
    } catch {
      /* ignore */
    }
    setShowSeed(bundle.students.length === 0);
  };

  const reloadFromSheets = async () => {
    if (!sheetsEnabled) return;
    setSyncStatus('loading');
    setSyncMessage('正在從 Google 試算表載入資料…');
    try {
      const bundle = await loadFromSheets();
      skipNextSave.current = true;
      applyBundle(bundle);
      setSyncStatus('connected');
      setSyncMessage(
        bundle.students.length === 0
          ? '試算表目前是空的，可點「寫入範例資料」初始化'
          : `已載入 ${bundle.students.length} 位學生資料`
      );
      setReady(true);
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      setSyncMessage(
        err instanceof Error
          ? `連線失敗：${err.message}`
          : '試算表連線失敗，請檢查 Apps Script 部署'
      );
      setReady(true);
    }
  };

  const handleSeed = async () => {
    if (!sheetsEnabled) return;
    setSyncStatus('saving');
    setSyncMessage('正在把範例資料寫入試算表…');
    const bundle = {
      students: INITIAL_STUDENTS,
      documents: INITIAL_DOCUMENTS,
      auditLogs: INITIAL_AUDIT_LOGS,
      adminAccounts: normalizeAdminAccounts(adminAccounts),
    };
    try {
      await seedSheets(bundle);
      skipNextSave.current = true;
      applyBundle(bundle);
      setSyncStatus('connected');
      setSyncMessage('範例資料已寫入試算表，各處室可直接在表中維護');
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      setSyncMessage(err instanceof Error ? err.message : '寫入範例資料失敗');
    }
  };

  useEffect(() => {
    if (sheetsEnabled) {
      reloadFromSheets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 本機模式：寫入 localStorage
  useEffect(() => {
    if (sheetsEnabled) return;
    try {
      localStorage.setItem('nstu_students_data', JSON.stringify(students));
    } catch (e) {
      console.error(e);
    }
  }, [students]);

  useEffect(() => {
    if (sheetsEnabled) return;
    try {
      localStorage.setItem('nstu_uploaded_docs', JSON.stringify(uploadedDocs));
    } catch (e) {
      console.error(e);
    }
  }, [uploadedDocs]);

  useEffect(() => {
    if (sheetsEnabled) return;
    try {
      localStorage.setItem(
        ADMIN_ACCOUNTS_STORAGE_KEY,
        JSON.stringify(adminAccounts)
      );
    } catch (e) {
      console.error(e);
    }
  }, [adminAccounts]);

  // 試算表模式：變更後 debounce 回寫
  useEffect(() => {
    if (!sheetsEnabled || !ready) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSyncStatus('saving');
      setSyncMessage('正在同步寫回試算表…');
      try {
        const latestAudit = getAuditLogs();
        await saveToSheets({
          students,
          documents: uploadedDocs,
          auditLogs: latestAudit.length > 0 ? latestAudit : auditLogs,
          adminAccounts,
        });
        if (latestAudit.length > 0) setAuditLogs(latestAudit);
        setSyncStatus('connected');
        setSyncMessage('已同步至 Google 試算表');
      } catch (err) {
        console.error(err);
        setSyncStatus('error');
        setSyncMessage(err instanceof Error ? err.message : '同步失敗');
      }
    }, 1500);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [students, uploadedDocs, auditLogs, adminAccounts, ready]);

  const refreshAuditFromStorage = () => {
    const logs = getAuditLogs();
    if (logs.length > 0) setAuditLogs(logs);
  };

  const handleUpdateStudent = (updatedStudent: StudentProfile) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === updatedStudent.studentId ? updatedStudent : s))
    );
    if (currentStudent?.studentId === updatedStudent.studentId) {
      setCurrentStudent(updatedStudent);
    }
  };

  const handleUpdateStudents = (updatedList: StudentProfile[]) => {
    setStudents(updatedList);
    if (currentStudent) {
      const refreshed = updatedList.find((s) => s.studentId === currentStudent.studentId);
      if (refreshed) setCurrentStudent(refreshed);
    }
  };

  const handleUploadDoc = (newDoc: UploadedDocument) => {
    setUploadedDocs((prev) => [newDoc, ...prev]);
  };

  const handleUpdateUploadedDocs = (updated: UploadedDocument[]) => {
    setUploadedDocs(updated);
  };

  const handleStudentLoginSuccess = (student: StudentProfile) => {
    setCurrentStudent(student);
    setCurrentRole('student');
    setIsStudentLoggedIn(true);
    setIsAdminLoggedIn(false);
    setAuthView('student');
  };

  const handleAdminLoginSuccess = (
    role: Exclude<RoleType, 'student'>,
    displayName: string
  ) => {
    setCurrentRole(role);
    setAdminDisplayName(displayName);
    setIsAdminLoggedIn(true);
    setIsStudentLoggedIn(false);
    setCurrentStudent(null);
    setAuthView('student');
    refreshAuditFromStorage();
  };

  const handleRoleChange = (role: RoleType, studentId?: string) => {
    // 正式模式禁止漢堡／下拉一鍵切換身分
    if (!demoMode) return;

    setCurrentRole(role);
    if (role === 'student') {
      const target = students.find((s) => s.studentId === studentId) || students[0];
      if (!target) return;
      setCurrentStudent(target);
      setIsStudentLoggedIn(true);
      setIsAdminLoggedIn(false);
      logAuditEvent({
        operatorRole: 'student',
        operatorName: `${target.name} (學生切換)`,
        targetStudentId: target.studentId,
        targetStudentName: target.name,
        action: '登入驗證',
        securityLevel: '常規',
        details: `切換至學生 [${target.studentId} ${target.name}] 查詢介面`,
      });
    } else {
      setIsStudentLoggedIn(false);
      setIsAdminLoggedIn(true);
      setAdminDisplayName(
        role === 'academic_affairs'
          ? '教務處註冊組'
          : role === 'student_affairs'
          ? '學務處生輔組'
          : '系統與資安管理員'
      );
      logAuditEvent({
        operatorRole: role,
        operatorName: adminDisplayName || 'Demo 處室切換',
        targetStudentId: '校務處室管理台',
        targetStudentName: '全體學生',
        action: '查詢個人資料',
        securityLevel: '常規',
        details: `Demo 切換進入 ${role} 行政作業管理介面`,
      });
    }
    refreshAuditFromStorage();
  };

  const handleLogout = () => {
    const operatorName =
      currentRole === 'student'
        ? currentStudent?.name || '學生'
        : adminDisplayName || '處室人員';
    logAuditEvent({
      operatorRole: currentRole,
      operatorName,
      targetStudentId: currentStudent?.studentId || '系統',
      targetStudentName: currentStudent?.name || '工作階段',
      action: '登入驗證',
      securityLevel: '常規',
      details: '使用者已安全登出系統，Session 權限已銷毀',
    });
    setIsStudentLoggedIn(false);
    setIsAdminLoggedIn(false);
    setCurrentStudent(null);
    setAdminDisplayName('');
    setCurrentRole('student');
    setAuthView('student');
    refreshAuditFromStorage();
  };

  const isLoggedIn = isStudentLoggedIn || isAdminLoggedIn;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      
      <DataSyncBanner
        status={syncStatus}
        message={syncMessage}
        sheetsEnabled={sheetsEnabled}
        onReload={reloadFromSheets}
        onSeed={handleSeed}
        showSeed={showSeed || (sheetsEnabled && students.length === 0)}
      />

      <Navbar
        currentRole={currentRole}
        currentStudent={currentStudent}
        onRoleChange={handleRoleChange}
        onLogout={handleLogout}
        onOpenSecurityNotice={() => setIsSecurityNoticeOpen(true)}
        allStudents={students}
        allowDemoSwitch={demoMode}
        isLoggedIn={isLoggedIn}
      />

      <main className="flex-1 pb-12">
        {sheetsEnabled && !ready ? (
          <div className="max-w-lg mx-auto mt-24 text-center text-slate-500 text-sm">
            正在連線 Google 試算表…
          </div>
        ) : (
          <>
            {!isLoggedIn && authView === 'student' && (
              <StudentLogin
                students={students}
                onLoginSuccess={handleStudentLoginSuccess}
                onSwitchToAdmin={() => {
                  if (demoMode) {
                    handleRoleChange('academic_affairs');
                  } else {
                    setAuthView('admin');
                  }
                }}
                onOpenSecurityNotice={() => setIsSecurityNoticeOpen(true)}
              />
            )}

            {!isLoggedIn && authView === 'admin' && (
              <AdminLogin
                onLoginSuccess={handleAdminLoginSuccess}
                onBackToStudent={() => setAuthView('student')}
                adminAccounts={adminAccounts}
              />
            )}

            {isStudentLoggedIn && currentStudent && (
              <StudentPortal
                student={currentStudent}
                onUpdateStudent={handleUpdateStudent}
                uploadedDocs={uploadedDocs}
                onUploadDoc={handleUploadDoc}
                onOpenSecurityNotice={() => setIsSecurityNoticeOpen(true)}
              />
            )}

            {isAdminLoggedIn && currentRole !== 'student' && (
              <AdminPortal
                currentRole={currentRole}
                onRoleChange={handleRoleChange}
                allowDemoSwitch={demoMode}
                students={students}
                onUpdateStudents={handleUpdateStudents}
                auditLogs={auditLogs}
                uploadedDocs={uploadedDocs}
                onUpdateUploadedDocs={handleUpdateUploadedDocs}
                onOpenSecurityNotice={() => setIsSecurityNoticeOpen(true)}
                adminAccounts={adminAccounts}
                onUpdateAdminAccounts={(next) => {
                  setAdminAccounts(normalizeAdminAccounts(next));
                }}
              />
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              高雄市立中正高工 校務資訊系統 • 符合教育部資通安全責任等級規範與個人資料保護法
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <button
              onClick={() => setIsSecurityNoticeOpen(true)}
              className="hover:text-blue-600 underline transition-colors"
            >
              個資法告知事項
            </button>
            <span>|</span>
            <span className="flex items-center space-x-1">
              <PhoneCall className="w-3 h-3" />
              <span>教務處註冊組專線：(07) 711-8171</span>
            </span>
          </div>
        </div>
      </footer>

      <SecurityNoticeModal
        isOpen={isSecurityNoticeOpen}
        onClose={() => setIsSecurityNoticeOpen(false)}
        onAccept={() => setIsSecurityNoticeOpen(false)}
      />

    </div>
  );
}
