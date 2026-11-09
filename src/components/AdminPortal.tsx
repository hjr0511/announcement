import React, { useState } from 'react';
import { 
  StudentProfile, 
  RoleType, 
  AuditLogEntry, 
  UploadedDocument, 
  DisciplinaryRecord 
} from '../types';
import { maskNationalId, maskPhone, logAuditEvent } from '../utils/security';
import { 
  Building2, 
  GraduationCap, 
  Award, 
  ShieldCheck, 
  FileSpreadsheet, 
  Search, 
  Plus, 
  Edit3, 
  Check, 
  X, 
  UploadCloud, 
  Download, 
  AlertCircle, 
  Eye, 
  Lock, 
  Clock, 
  UserCheck, 
  FileText,
  Filter,
  CheckCircle2,
  Copy,
  HelpCircle,
  Share2,
  ExternalLink
} from 'lucide-react';

interface Props {
  currentRole: RoleType;
  onRoleChange: (role: RoleType, studentId?: string) => void;
  allowDemoSwitch?: boolean;
  students: StudentProfile[];
  onUpdateStudents: (updated: StudentProfile[]) => void;
  auditLogs: AuditLogEntry[];
  uploadedDocs: UploadedDocument[];
  onUpdateUploadedDocs: (updated: UploadedDocument[]) => void;
  onOpenSecurityNotice: () => void;
}

export const AdminPortal: React.FC<Props> = ({
  currentRole,
  onRoleChange,
  allowDemoSwitch = false,
  students,
  onUpdateStudents,
  auditLogs,
  uploadedDocs,
  onUpdateUploadedDocs,
  onOpenSecurityNotice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.studentId || '');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  
  // 批次匯入 CSV 彈窗狀態
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [csvSuccessMsg, setCsvSuccessMsg] = useState<string | null>(null);

  // 教務處成績修改 Modal 狀態
  const [editingGradeStudent, setEditingGradeStudent] = useState<StudentProfile | null>(null);
  const [editCourseCode, setEditCourseCode] = useState('');
  const [editNewScore, setEditNewScore] = useState<number>(90);

  // 學務處新增獎懲 Modal 狀態
  const [isDisciplineModalOpen, setIsDisciplineModalOpen] = useState(false);
  const [discType, setDiscType] = useState<'獎勵' | '懲戒'>('獎勵');
  const [discCategory, setDiscCategory] = useState<DisciplinaryRecord['category']>('嘉獎');
  const [discReason, setDiscReason] = useState('');

  // 審核證件 Modal 狀態
  const [reviewingDoc, setReviewingDoc] = useState<UploadedDocument | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  // 成績發布狀態與指引狀態
  const [isGradePublished, setIsGradePublished] = useState(true);
  const [showGuideBanner, setShowGuideBanner] = useState(true);
  const [isNoticeCopied, setIsNoticeCopied] = useState(false);
  const [csvImportMode, setCsvImportMode] = useState<'grades' | 'students'>('grades');

  // 新增科目成績 Modal 狀態
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [addCourseSemesterId, setAddCourseSemesterId] = useState('113-1');
  const [newCourseId, setNewCourseId] = useState('CS325');
  const [newCourseName, setNewCourseName] = useState('雲端架構與微服務');
  const [newCourseCredits, setNewCourseCredits] = useState(3);
  const [newCourseCategory, setNewCourseCategory] = useState<'必修' | '選修' | '通識'>('選修');
  const [newCourseScore, setNewCourseScore] = useState(92);

  // 複製學生查詢通知訊息
  const handleCopyQueryGuide = () => {
    const text = `【高雄市立中正高工 教務處通知：113學年度學期成績開放查詢】\n\n各位親愛的同學好：\n本學期個人成績已正式核定並發布！請全體同學至「學生學籍成績查詢系統」登入查詢個人成績與下載成績單 PDF。\n\n▶ 查詢系統網址：${window.location.origin}\n▶ 登入身分：選擇「學生身分」\n▶ 登入帳號：您的個人學號（如：S1121001）\n▶ 登入密碼：身分證字號（如：A123456789，含首碼英文字母共10碼）\n▶ 防偽驗證：請輸入畫面顯示之4位數圖形安全驗證碼\n\n如有任何成績或個資疑問，請洽詢教務處註冊組專線：(07) 711-8171。`;
    navigator.clipboard.writeText(text);
    setIsNoticeCopied(true);
    setTimeout(() => setIsNoticeCopied(false), 3000);
  };

  // 教務處：新增科目成績處理
  const handleAddCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;

    let letter = 'B';
    let gp = 3.0;
    const numScore = Number(newCourseScore);
    if (numScore >= 90) { letter = 'A+'; gp = 4.3; }
    else if (numScore >= 85) { letter = 'A'; gp = 4.0; }
    else if (numScore >= 80) { letter = 'A-'; gp = 3.7; }
    else if (numScore >= 77) { letter = 'B+'; gp = 3.3; }
    else if (numScore >= 70) { letter = 'B'; gp = 3.0; }
    else if (numScore >= 60) { letter = 'C'; gp = 2.0; }
    else { letter = 'F'; gp = 0.0; }

    const newCourseItem = {
      courseId: newCourseId.trim().toUpperCase(),
      courseName: newCourseName.trim(),
      courseNameEn: 'Course ' + newCourseName.trim(),
      credits: Number(newCourseCredits),
      category: newCourseCategory,
      score: numScore,
      letterGrade: letter,
      gp,
      passed: numScore >= 60,
      instructor: '授課教授 (教務處登錄)',
    };

    const updated = students.map((stu) => {
      if (stu.studentId !== activeStudent.studentId) return stu;
      const updatedSemesters = stu.semesters.map((sem) => {
        if (sem.semesterId === addCourseSemesterId) {
          const updatedCourses = [newCourseItem, ...sem.courses];
          const totalScore = updatedCourses.reduce((sum, c) => sum + c.score * c.credits, 0);
          const totalCreds = updatedCourses.reduce((sum, c) => sum + c.credits, 0);
          const avg = totalCreds > 0 ? totalScore / totalCreds : sem.semesterAverage;

          return {
            ...sem,
            courses: updatedCourses,
            semesterCredits: sem.semesterCredits + Number(newCourseCredits),
            earnedCredits: sem.earnedCredits + (numScore >= 60 ? Number(newCourseCredits) : 0),
            semesterAverage: Math.round(avg * 10) / 10,
          };
        }
        return sem;
      });

      return {
        ...stu,
        semesters: updatedSemesters,
        totalCreditsEarned: stu.totalCreditsEarned + (numScore >= 60 ? Number(newCourseCredits) : 0),
      };
    });

    onUpdateStudents(updated);

    logAuditEvent({
      operatorRole: 'academic_affairs',
      operatorName: '教務處註冊組組長',
      targetStudentId: activeStudent.studentId,
      targetStudentName: activeStudent.name,
      action: '教務處成績修改',
      securityLevel: '關鍵變更',
      details: `新增修習科目 [${newCourseId} ${newCourseName}] 成績: ${newCourseScore} 分，並重算學分與平均`,
    });

    setIsAddCourseModalOpen(false);
  };

  const activeStudent = students.find((s) => s.studentId === selectedStudentId) || students[0];

  // 學生名冊篩選
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.includes(searchQuery) ||
      s.department.includes(searchQuery);
    const matchesDept = selectedDeptFilter === 'all' || s.department.includes(selectedDeptFilter);
    return matchesSearch && matchesDept;
  });

  // 教務處：更新成績
  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGradeStudent || !editCourseCode) return;

    const updated = students.map((stu) => {
      if (stu.studentId !== editingGradeStudent.studentId) return stu;
      const updatedSemesters = stu.semesters.map((sem) => {
        const updatedCourses = sem.courses.map((course) => {
          if (course.courseId === editCourseCode) {
            const numScore = Number(editNewScore);
            let letter = 'B';
            let gp = 3.0;
            if (numScore >= 90) { letter = 'A+'; gp = 4.3; }
            else if (numScore >= 85) { letter = 'A'; gp = 4.0; }
            else if (numScore >= 80) { letter = 'A-'; gp = 3.7; }
            else if (numScore >= 77) { letter = 'B+'; gp = 3.3; }
            else if (numScore >= 70) { letter = 'B'; gp = 3.0; }
            else if (numScore >= 60) { letter = 'C'; gp = 2.0; }
            else { letter = 'F'; gp = 0.0; }

            return {
              ...course,
              score: numScore,
              letterGrade: letter,
              gp,
              passed: numScore >= 60,
            };
          }
          return course;
        });

        // 重新計算學期平均
        const totalScore = updatedCourses.reduce((sum, c) => sum + c.score * c.credits, 0);
        const totalCreds = updatedCourses.reduce((sum, c) => sum + c.credits, 0);
        const avg = totalCreds > 0 ? totalScore / totalCreds : sem.semesterAverage;

        return {
          ...sem,
          courses: updatedCourses,
          semesterAverage: Math.round(avg * 10) / 10,
        };
      });

      return {
        ...stu,
        semesters: updatedSemesters,
      };
    });

    onUpdateStudents(updated);

    logAuditEvent({
      operatorRole: 'academic_affairs',
      operatorName: '張秘書 (教務處註冊組)',
      targetStudentId: editingGradeStudent.studentId,
      targetStudentName: editingGradeStudent.name,
      action: '教務處成績修改',
      securityLevel: '關鍵變更',
      details: `修改科目 [${editCourseCode}] 成績調整為 ${editNewScore} 分，系統已同步重算學業平均與等第`,
    });

    setEditingGradeStudent(null);
  };

  // 學務處：新增獎懲
  const handleAddDiscipline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent || !discReason.trim()) return;

    const newRecord: DisciplinaryRecord = {
      id: 'D-' + Date.now().toString(36).toUpperCase(),
      date: new Date().toISOString().split('T')[0],
      type: discType,
      category: discCategory,
      reason: discReason.trim(),
      approvalOffice: '學務處',
      status: '生效',
    };

    const updated = students.map((stu) => {
      if (stu.studentId === activeStudent.studentId) {
        return {
          ...stu,
          disciplinaryRecords: [newRecord, ...stu.disciplinaryRecords],
        };
      }
      return stu;
    });

    onUpdateStudents(updated);

    logAuditEvent({
      operatorRole: 'student_affairs',
      operatorName: '李組長 (學務處生輔組)',
      targetStudentId: activeStudent.studentId,
      targetStudentName: activeStudent.name,
      action: '學務處查閱操行',
      securityLevel: '常規',
      details: `登錄學生生活獎懲紀錄：${discType} [${discCategory}] - ${discReason}`,
    });

    setIsDisciplineModalOpen(false);
    setDiscReason('');
  };

  // 審核學生證件
  const handleReviewDoc = (newStatus: '已核可' | '需補件') => {
    if (!reviewingDoc) return;

    const updated = uploadedDocs.map((d) => {
      if (d.id === reviewingDoc.id) {
        return {
          ...d,
          status: newStatus,
          reviewNotes: reviewNote.trim() || (newStatus === '已核可' ? '處室查驗核准通過' : '所附文件不全或模糊，請重新上傳清晰版'),
        };
      }
      return d;
    });

    onUpdateUploadedDocs(updated);

    logAuditEvent({
      operatorRole: currentRole,
      operatorName: currentRole === 'academic_affairs' ? '教務處註冊組' : '學務處審件人員',
      targetStudentId: reviewingDoc.studentId,
      targetStudentName: reviewingDoc.studentId,
      action: '上傳個人證件',
      securityLevel: '常規',
      details: `完成學生證件 [${reviewingDoc.fileName}] 審查，結果為: ${newStatus}`,
    });

    setReviewingDoc(null);
    setReviewNote('');
  };

  // 處理批次 CSV 匯入
  const handleProcessCsv = () => {
    if (!csvContent.trim()) {
      alert('請輸入或貼上 CSV 資料！');
      return;
    }

    try {
      const lines = csvContent.trim().split('\n');
      let importedCount = 0;

      if (csvImportMode === 'grades') {
        // 格式: 學號,科目代碼,科目名稱,學分,類別,成績
        // 例如: S1121001,CS325,雲端架構與微服務,3,選修,95
        const newStudents = students.map((stu) => {
          let updatedStu = { ...stu };
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map((c) => c.trim());
            if (cols.length >= 6 && cols[0].toUpperCase() === stu.studentId.toUpperCase()) {
              const [, cId, cName, creds, cat, scoreStr] = cols;
              const numScore = Number(scoreStr) || 80;
              let letter = 'B';
              let gp = 3.0;
              if (numScore >= 90) { letter = 'A+'; gp = 4.3; }
              else if (numScore >= 85) { letter = 'A'; gp = 4.0; }
              else if (numScore >= 80) { letter = 'A-'; gp = 3.7; }
              else if (numScore >= 77) { letter = 'B+'; gp = 3.3; }
              else if (numScore >= 70) { letter = 'B'; gp = 3.0; }
              else if (numScore >= 60) { letter = 'C'; gp = 2.0; }
              else { letter = 'F'; gp = 0.0; }

              const courseItem = {
                courseId: cId.toUpperCase(),
                courseName: cName,
                courseNameEn: 'Course ' + cName,
                credits: Number(creds) || 3,
                category: ((cat === '必修' || cat === '選修' || cat === '通識') ? cat : '選修') as '必修' | '選修' | '通識',
                score: numScore,
                letterGrade: letter,
                gp,
                passed: numScore >= 60,
                instructor: '授課教授 (批次匯入)',
              };

              const updatedSemesters = updatedStu.semesters.map((sem, sIdx) => {
                if (sIdx === 0) {
                  const filtered = sem.courses.filter((c) => c.courseId !== cId.toUpperCase());
                  const allCourses = [courseItem, ...filtered];
                  const totalScore = allCourses.reduce((sum, c) => sum + c.score * c.credits, 0);
                  const totalCreds = allCourses.reduce((sum, c) => sum + c.credits, 0);
                  const avg = totalCreds > 0 ? totalScore / totalCreds : sem.semesterAverage;
                  return {
                    ...sem,
                    courses: allCourses,
                    semesterAverage: Math.round(avg * 10) / 10,
                  };
                }
                return sem;
              });

              updatedStu = {
                ...updatedStu,
                semesters: updatedSemesters,
              };
              importedCount++;
            }
          }
          return updatedStu;
        });

        onUpdateStudents(newStudents);

        logAuditEvent({
          operatorRole: 'academic_affairs',
          operatorName: '教務處註冊組組長',
          targetStudentId: '全校成績匯入',
          targetStudentName: `${importedCount} 科次`,
          action: '教務處成績修改',
          securityLevel: '關鍵變更',
          details: `批次匯入發布全校成績 CSV 共 ${importedCount} 門科目成績，學生登入即可查詢`,
        });

        setCsvSuccessMsg(`✓ 成功匯入並發布 ${importedCount} 科次學生成績！學生登入即可查閱最新分數與下載成績單。`);
        setTimeout(() => {
          setIsCsvModalOpen(false);
          setCsvSuccessMsg(null);
          setCsvContent('');
        }, 1800);
      } else {
        // 學生學籍名冊匯入模式: 學號,身分證字號,姓名,學系,年級,聯絡電話
        const newStudents = [...students];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim());
          if (cols.length >= 5) {
            const [sId, nId, name, dept, grade] = cols;
            const existingIdx = newStudents.findIndex((s) => s.studentId === sId);
            if (existingIdx >= 0) {
              newStudents[existingIdx] = {
                ...newStudents[existingIdx],
                nationalId: nId || newStudents[existingIdx].nationalId,
                name: name || newStudents[existingIdx].name,
                department: dept || newStudents[existingIdx].department,
                gradeLevel: Number(grade) || newStudents[existingIdx].gradeLevel,
              };
            } else {
              newStudents.push({
                studentId: sId,
                nationalId: nId,
                name,
                nameEn: 'Student, ' + name,
                gender: '男',
                birthDate: '2005-01-01',
                college: dept.includes('資工') ? '資訊與工程學院' : '科技學院',
                department: dept,
                gradeLevel: Number(grade) || 1,
                className: dept + grade + '甲',
                advisor: '未指派導師',
                enrollmentStatus: '在學',
                enrollmentDate: '2024-09-01',
                email: `${sId.toLowerCase()}@student.ccvs.kh.edu.tw`,
                phone: cols[5] || '0912-000-000',
                emergencyContact: { name: '家長', relationship: '父母', phone: '0911-000-000' },
                mailingAddress: '臺北市',
                permanentAddress: '臺北市',
                avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
                isProfileConfirmed: false,
                totalCreditsEarned: 18,
                graduationRequiredCredits: 128,
                cumulativeGpa: 3.5,
                cumulativeAverage: 82.0,
                semesters: [
                  {
                    semesterId: '113-1',
                    semesterName: '113學年度第1學期',
                    academicYear: '113',
                    semesterTerm: '上學期',
                    semesterCredits: 18,
                    earnedCredits: 18,
                    semesterAverage: 82.0,
                    semesterGpa: 3.5,
                    classRank: 10,
                    classSize: 45,
                    departmentRank: 25,
                    departmentSize: 100,
                    conductScore: 85,
                    conductGrade: '甲等',
                    courses: [
                      { courseId: 'GEN101', courseName: '大學導論與生涯規劃', courseNameEn: 'University Orientation', credits: 2, category: '必修', score: 85, letterGrade: 'A', gp: 4.0, passed: true, instructor: '系導師' }
                    ]
                  }
                ],
                disciplinaryRecords: [],
                attendance: { leaveDays: 0, sickLeaveDays: 0, officialLeaveDays: 0, truancyHours: 0, attendanceRate: 100 },
              });
            }
            importedCount++;
          }
        }

        onUpdateStudents(newStudents);

        logAuditEvent({
          operatorRole: 'academic_affairs',
          operatorName: '教務處註冊組組長',
          targetStudentId: '批次匯入',
          targetStudentName: `${importedCount} 位學生`,
          action: '匯入學籍資料',
          securityLevel: '關鍵變更',
          details: `成功自 CSV 匯入/更新 ${importedCount} 筆學生學籍名冊`,
        });

        setCsvSuccessMsg(`✓ 成功匯入更新 ${importedCount} 筆學生學籍資料！`);
        setTimeout(() => {
          setIsCsvModalOpen(false);
          setCsvSuccessMsg(null);
          setCsvContent('');
        }, 1500);
      }
    } catch {
      alert('CSV 格式解析錯誤，請確認格式符合規定');
    }
  };

  // 下載 CSV 範本
  const downloadCsvTemplate = () => {
    let header = '';
    let sample = '';
    let filename = '';

    if (csvImportMode === 'grades') {
      header = '學號,科目代碼,科目名稱,學分,類別,成績\n';
      sample = 'S1121001,CS325,雲端架構與微服務,3,選修,95\nS1121002,FIN325,永續金融與ESG投資,3,選修,92\nS1112003,ME420,智慧精密製造,3,選修,88\n';
      filename = '學生成績批次匯入範本_教務處.csv';
    } else {
      header = '學號,身分證字號,姓名,學系,年級,聯絡電話\n';
      sample = 'S1121099,A123456789,測試生,資訊工程學系,3,0912-345-678\n';
      filename = '學生學籍名冊匯入範本_教務處.csv';
    }

    const blob = new Blob([header + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Department Role Bar & Strict RBAC Description */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-indigo-700" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              多處室行政管理協同後台 (RBAC 嚴格權限隔離)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            遵循校務資訊安全與最小授權原則，區隔教務處、學務處與系統資安管理單位權限。
          </p>
        </div>

        {/* Department Switcher Tabs — 僅 Demo；正式模式只顯示目前登入處室 */}
        {allowDemoSwitch ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onRoleChange('academic_affairs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                currentRole === 'academic_affairs'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>教務處 (學籍成績)</span>
            </button>

            <button
              onClick={() => onRoleChange('student_affairs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                currentRole === 'student_affairs'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>學務處 (生活輔導與獎懲)</span>
            </button>

            <button
              onClick={() => onRoleChange('system_admin')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                currentRole === 'system_admin'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>系統與資安稽核處</span>
            </button>
          </div>
        ) : (
          <div className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            目前登入處室已鎖定（正式模式）
          </div>
        )}
      </div>

      {/* RBAC Permission Banner */}
      <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
        currentRole === 'academic_affairs'
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          : currentRole === 'student_affairs'
          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
          : 'bg-purple-50/70 border-purple-200 text-purple-900'
      }`}>
        <div className="flex items-center space-x-2">
          <Lock className="w-4 h-4 shrink-0" />
          <span>
            {currentRole === 'academic_affairs' && (
              <>
                <strong>教務處授權權限：</strong>可管理全校學籍名冊、批次匯入 CSV、修訂學科成績、發布成績通知單。
                <span className="text-emerald-700 ml-1 font-semibold">[限制：生活獎懲與諮商輔導為學務處權責，無法竄改]</span>
              </>
            )}
            {currentRole === 'student_affairs' && (
              <>
                <strong>學務處授權權限：</strong>可登記學生德育獎懲、考評操行、查核出缺勤出席率、審查學生上傳大頭照與證件。
                <span className="text-amber-800 ml-1 font-semibold">[限制：學科學分與成績欄位為唯讀鎖定，無法變更學分]</span>
              </>
            )}
            {currentRole === 'system_admin' && (
              <>
                <strong>資安長與系統管理處：</strong>監控全校個資調閱軌跡 (Audit Logs)、管理資料脫敏與遮罩開關、阻斷異常登入。
              </>
            )}
          </span>
        </div>

        {currentRole === 'academic_affairs' && (
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs flex items-center space-x-1 shrink-0"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>批次匯入學籍/成績 (CSV)</span>
          </button>
        )}
      </div>

      {/* Grade Publishing & Student Query Management Center (教務處專用) */}
      {currentRole === 'academic_affairs' && (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-emerald-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-emerald-700/50">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <GraduationCap className="w-5 h-5" />
                </span>
                <h2 className="text-base font-bold text-white tracking-tight">
                  教務處成績發布與學生查詢管理中心
                </h2>
              </div>
              <p className="text-xs text-emerald-200">
                掌握全校成績發布狀態、指引學生以「學號」+「身分證字號」雙因子登入查閱與下載成績單 PDF。
              </p>
            </div>

            {/* Publishing Status Toggle & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsGradePublished(!isGradePublished)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center space-x-2 transition-all ${
                  isGradePublished
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-800 text-amber-300 border-amber-600/50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isGradePublished ? 'bg-white animate-pulse' : 'bg-amber-400'}`}></span>
                <span>{isGradePublished ? '狀態：已發布 (開放學生查詢)' : '狀態：結算中 (暫停學生查詢)'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyQueryGuide}
                className="px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all flex items-center space-x-1.5"
                title="複製包含系統網址與登入規則之查詢通知信"
              >
                <Copy className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isNoticeCopied ? '✓ 已複製通知範本' : '複製學生查詢通知'}</span>
              </button>

              {allowDemoSwitch && (
                <button
                  type="button"
                  onClick={() => onRoleChange('student', activeStudent?.studentId)}
                  className="px-3.5 py-2 text-xs font-bold bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl transition-all flex items-center space-x-1.5 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                  <span>以學生身分預覽前台</span>
                </button>
              )}
            </div>
          </div>

          {/* 3-Step Guide for Letting Students Check Grades */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <span>如何讓學生查詢成績？【教務處 3 步驟標準作業流程】</span>
              </span>
              <button
                type="button"
                onClick={() => setShowGuideBanner(!showGuideBanner)}
                className="text-[11px] text-emerald-300/80 hover:text-white underline"
              >
                {showGuideBanner ? '收合指引' : '展開指引'}
              </button>
            </div>

            {showGuideBanner && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-emerald-100 pt-2 border-t border-white/10">
                <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-1">
                  <div className="font-bold text-white flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center text-[11px] font-mono">1</span>
                    <span>登錄或匯入成績</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                    在下方名冊直接點選學生進行「修改成績」或「＋新增科目」，亦可點右上角「批次匯入學籍/成績 (CSV)」一次上傳全班成績單。
                  </p>
                </div>

                <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-1">
                  <div className="font-bold text-white flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center text-[11px] font-mono">2</span>
                    <span>確認發布狀態開啟</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                    確認上方開關為「<strong>已發布（開放學生查詢）</strong>」綠燈。系統即時生效，前台學生端便可立即搜尋到最新科目成績與排名。
                  </p>
                </div>

                <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-1">
                  <div className="font-bold text-white flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center text-[11px] font-mono">3</span>
                    <span>通知學生登入查詢</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                    學生連線進入系統首頁，輸入「<strong>學號</strong>」與「<strong>身分證字號</strong>」，通過圖形驗證碼後，即可查閱成績並一鍵下載正式 PDF 成績單！
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Administrative Workplace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Student Roster & Search (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>學生名冊列表 ({filteredStudents.length} 人)</span>
              </h3>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋學號、姓名或系所..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Student List */}
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredStudents.map((stu) => {
                const isSelected = stu.studentId === activeStudent?.studentId;
                return (
                  <div
                    key={stu.studentId}
                    onClick={() => {
                      setSelectedStudentId(stu.studentId);
                      logAuditEvent({
                        operatorRole: currentRole,
                        operatorName: currentRole === 'academic_affairs' ? '教務處行政專員' : '學務處輔導專員',
                        targetStudentId: stu.studentId,
                        targetStudentName: stu.name,
                        action: '查詢個人資料',
                        securityLevel: '敏感調閱',
                        details: `調閱學生 [${stu.studentId} ${stu.name}] 之學籍檔案`,
                      });
                    }}
                    className={`p-3 rounded-xl cursor-pointer border text-xs transition-all ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-400 shadow-2xs ring-1 ring-blue-300'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{stu.name}</span>
                        <span className="font-mono text-[11px] text-slate-500">{stu.studentId}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 font-semibold text-slate-600">
                        {stu.className}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{stu.department}</span>
                      <span className="font-mono text-blue-600 font-semibold">
                        GPA {stu.cumulativeGpa.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Document Verifications Box */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <span>學生上傳待審件清單 ({uploadedDocs.filter((d) => d.status === '待審核').length})</span>
              </h4>
            </div>

            <div className="space-y-2">
              {uploadedDocs.filter((d) => d.status === '待審核').length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">目前無待審件</p>
              ) : (
                uploadedDocs
                  .filter((d) => d.status === '待審核')
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{doc.category}</div>
                        <div className="text-[10px] text-slate-500">學號：{doc.studentId} • {doc.fileName}</div>
                      </div>
                      <button
                        onClick={() => {
                          setReviewingDoc(doc);
                          setReviewNote('');
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-2xs"
                      >
                        審查
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Student Detailed View & Action Panel (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {activeStudent && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              
              {/* Student Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={activeStudent.avatarUrl}
                    alt={activeStudent.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-bold text-slate-900">{activeStudent.name}</h2>
                      <span className="font-mono text-xs text-slate-500 font-semibold">{activeStudent.studentId}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {activeStudent.enrollmentStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeStudent.college} • {activeStudent.department} • {activeStudent.className}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-slate-400 block text-[10px]">個資核對狀態</span>
                  {activeStudent.isProfileConfirmed ? (
                    <span className="font-semibold text-emerald-600 flex items-center justify-end space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>已完成線上校對簽署</span>
                    </span>
                  ) : (
                    <span className="font-semibold text-amber-600">尚未完成個資核對</span>
                  )}
                </div>
              </div>

              {/* VIEW FOR ACADEMIC AFFAIRS (教務處視角) */}
              {currentRole === 'academic_affairs' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      <span>教務學程與學期成績核算</span>
                    </h3>
                    <span className="text-xs text-slate-500">
                      畢業門檻：{activeStudent.totalCreditsEarned} / {activeStudent.graduationRequiredCredits} 學分
                    </span>
                  </div>

                  {/* Semesters list with grade adjustment */}
                  {activeStudent.semesters.map((sem) => (
                    <div key={sem.semesterId} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 text-xs font-semibold gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-800 font-bold">{sem.semesterName}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setAddCourseSemesterId(sem.semesterId);
                              setIsAddCourseModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg font-bold text-[11px] flex items-center space-x-1 transition-colors"
                            title="為此學生新增一門科目與成績"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>＋新增科目成績</span>
                          </button>
                        </div>
                        <div className="space-x-3 text-slate-600">
                          <span>學期平均：<strong className="text-blue-600 font-mono">{sem.semesterAverage}</strong></span>
                          <span>GPA：<strong className="text-indigo-600 font-mono">{sem.semesterGpa}</strong></span>
                          <span>班排：第 {sem.classRank} 名</span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100/70 text-slate-500 text-[11px] font-medium border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3">代碼</th>
                              <th className="py-2 px-3">課程名稱</th>
                              <th className="py-2 px-3 text-center">學分</th>
                              <th className="py-2 px-3 text-center">類別</th>
                              <th className="py-2 px-3 text-center">成績</th>
                              <th className="py-2 px-3 text-center">等第</th>
                              <th className="py-2 px-3 text-right">操作</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {sem.courses.map((course) => (
                              <tr key={course.courseId} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-mono text-slate-500">{course.courseId}</td>
                                <td className="py-2.5 px-3 font-semibold text-slate-800">{course.courseName}</td>
                                <td className="py-2.5 px-3 text-center font-mono">{course.credits}</td>
                                <td className="py-2.5 px-3 text-center text-[10px] text-slate-600">{course.category}</td>
                                <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">{course.score}</td>
                                <td className="py-2.5 px-3 text-center font-mono font-semibold text-indigo-600">{course.letterGrade}</td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    onClick={() => {
                                      setEditingGradeStudent(activeStudent);
                                      setEditCourseCode(course.courseId);
                                      setEditNewScore(course.score);
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                                  >
                                    修改成績
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}

                  {/* Protected Area Notice */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-400 flex items-center justify-between">
                    <span>🔒 學生獎懲訪談與生活紀錄為學務處專屬權責，教務處依法無權調閱。</span>
                    <span className="font-mono text-[10px]">RBAC_PROTECTED</span>
                  </div>
                </div>
              )}

              {/* VIEW FOR STUDENT AFFAIRS (學務處視角) */}
              {currentRole === 'student_affairs' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>生活輔導、出缺勤與獎懲管理</span>
                    </h3>
                    <button
                      onClick={() => setIsDisciplineModalOpen(true)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>登記獎懲紀錄</span>
                    </button>
                  </div>

                  {/* Attendance Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-amber-50/50 p-4 rounded-xl border border-amber-200 text-xs">
                    <div>
                      <span className="text-slate-500 block">整體出席率</span>
                      <span className="text-base font-bold text-emerald-700">{activeStudent.attendance.attendanceRate}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">事病假累計</span>
                      <span className="text-base font-bold text-slate-800">
                        {activeStudent.attendance.leaveDays + activeStudent.attendance.sickLeaveDays} 天
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">公假時數</span>
                      <span className="text-base font-bold text-blue-700">{activeStudent.attendance.officialLeaveDays} 天</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">曠課紀錄</span>
                      <span className="text-base font-bold text-rose-700">{activeStudent.attendance.truancyHours} 小時</span>
                    </div>
                  </div>

                  {/* Disciplinary List */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">歷年德育獎懲與考評清單：</span>
                    {activeStudent.disciplinaryRecords.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">無獎懲登記紀錄</p>
                    ) : (
                      activeStudent.disciplinaryRecords.map((d) => (
                        <div
                          key={d.id}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              d.type === '獎勵' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {d.category}
                            </span>
                            <span className="text-slate-800 font-medium">{d.reason}</span>
                          </div>
                          <div className="text-slate-400 text-[11px] font-mono">{d.date}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Emergency Contact info (Only Student Affairs has full access) */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <span className="font-bold text-slate-700 block">學務處緊急聯絡資料 (生活輔導輔助)：</span>
                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <div>學生電話：<strong className="text-slate-900">{activeStudent.phone}</strong></div>
                      <div>緊急聯絡人：<strong className="text-slate-900">{activeStudent.emergencyContact.name} ({activeStudent.emergencyContact.phone})</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW FOR SYSTEM ADMIN (系統與資安管理處視角) */}
              {currentRole === 'system_admin' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>全校個資調閱日誌與資安稽核軌跡 (Audit Logs)</span>
                    </h3>
                    <span className="text-xs font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                      即時保存筆數：{auditLogs.length}
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">時間戳記</th>
                          <th className="py-2.5 px-3">操作者角色</th>
                          <th className="py-2.5 px-3">目標學生</th>
                          <th className="py-2.5 px-3">作業事件</th>
                          <th className="py-2.5 px-3">來源 IP / 設備</th>
                          <th className="py-2.5 px-3">安全等級</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {auditLogs.slice(0, 15).map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{log.timestamp}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{log.operatorName}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">{log.targetStudentName}</td>
                            <td className="py-2.5 px-3 font-medium text-blue-700">{log.action}</td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-500 font-mono">{log.ipAddress.split(' ')[0]}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                log.securityLevel === '關鍵變更'
                                  ? 'bg-rose-100 text-rose-800'
                                  : log.securityLevel === '敏感調閱'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {log.securityLevel}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-center justify-between">
                    <span>🛡️ 符合教育部校園資訊安全等級 A 級規範：所有使用者查詢與下載皆已留存數位指紋防範竄改。</span>
                    <button
                      onClick={onOpenSecurityNotice}
                      className="underline font-bold text-purple-800 hover:text-purple-950 shrink-0"
                    >
                      檢視規範
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* MODAL 1: 教務處修改成績 Modal */}
      {editingGradeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">教務處學期成績調整</h3>
              <button onClick={() => setEditingGradeStudent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">學生：</span>
                <span className="font-bold text-slate-800">{editingGradeStudent.name} ({editingGradeStudent.studentId})</span>
              </div>
              <div>
                <span className="text-slate-500 block">科目代碼：</span>
                <span className="font-mono font-bold text-blue-700">{editCourseCode}</span>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">新修訂分數 (0-100)：</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editNewScore}
                  onChange={(e) => setEditNewScore(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingGradeStudent(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  確認修改成績
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: 學務處新增獎懲 Modal */}
      {isDisciplineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">登記學生生活獎懲紀錄</h3>
              <button onClick={() => setIsDisciplineModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDiscipline} className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">學生：</span>
                <span className="font-bold text-slate-800">{activeStudent.name} ({activeStudent.studentId})</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">類別：</label>
                  <select
                    value={discType}
                    onChange={(e) => setDiscType(e.target.value as '獎勵' | '懲戒')}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="獎勵">獎勵</option>
                    <option value="懲戒">懲戒</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">等第：</label>
                  <select
                    value={discCategory}
                    onChange={(e) => setDiscCategory(e.target.value as DisciplinaryRecord['category'])}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="嘉獎">嘉獎</option>
                    <option value="小功">小功</option>
                    <option value="大功">大功</option>
                    <option value="警告">警告</option>
                    <option value="小過">小過</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">登記事由與事蹟：</label>
                <textarea
                  value={discReason}
                  onChange={(e) => setDiscReason(e.target.value)}
                  placeholder="例如：熱心服務校園社團活動表現傑出..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDisciplineModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm"
                >
                  確定登記
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: 批次匯入 CSV Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">教務處 批次匯入精靈 (CSV)</h3>
              </div>
              <button onClick={() => setIsCsvModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setCsvImportMode('grades');
                  setCsvContent('');
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  csvImportMode === 'grades'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📊 批次匯入科目成績 (全班/全校)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCsvImportMode('students');
                  setCsvContent('');
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  csvImportMode === 'students'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👥 批次匯入學生學籍名冊
              </button>
            </div>

            {csvSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold animate-fadeIn">
                {csvSuccessMsg}
              </div>
            )}

            <div className="text-xs text-slate-600 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">
                  {csvImportMode === 'grades'
                    ? '欄位順序：學號,科目代碼,科目名稱,學分,類別,成績'
                    : '欄位順序：學號,身分證字號,姓名,學系,年級,聯絡電話'}
                </span>
                <button
                  type="button"
                  onClick={downloadCsvTemplate}
                  className="text-blue-600 underline font-semibold flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下載官方 CSV 範本</span>
                </button>
              </div>

              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder={
                  csvImportMode === 'grades'
                    ? `學號,科目代碼,科目名稱,學分,類別,成績\nS1121001,CS325,雲端架構與微服務,3,選修,95\nS1121002,FIN325,永續金融與ESG投資,3,選修,92\nS1112003,ME420,智慧精密製造,3,選修,88`
                    : `學號,身分證字號,姓名,學系,年級,聯絡電話\nS1121088,A123456789,趙冠宇,資訊工程學系,3,0912-888-777\nS1121089,B220145675,黃羽婷,財務金融學系,3,0933-444-555`
                }
                rows={6}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  if (csvImportMode === 'grades') {
                    setCsvContent(
                      `學號,科目代碼,科目名稱,學分,類別,成績\nS1121001,CS325,雲端架構與微服務,3,選修,95\nS1121002,FIN325,永續金融與ESG投資,3,選修,92\nS1112003,ME420,智慧精密製造,3,選修,88`
                    );
                  } else {
                    setCsvContent(
                      `學號,身分證字號,姓名,學系,年級,聯絡電話\nS1121088,A123456789,趙冠宇,資訊工程學系,3,0912-888-777\nS1121089,B220145675,黃羽婷,財務金融學系,3,0933-444-555`
                    );
                  }
                }}
                className="text-xs text-slate-500 underline hover:text-slate-700 font-semibold"
              >
                [自動填入示範資料]
              </button>

              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleProcessCsv}
                  className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  確認解析並匯入
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3.5: 教務處新增科目成績 Modal */}
      {isAddCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">教務處 為學生新增修習科目成績</h3>
              </div>
              <button onClick={() => setIsAddCourseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCourseSubmit} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">目標學生：</span>
                <span className="font-bold text-slate-900">{activeStudent.name} ({activeStudent.studentId} • {activeStudent.className})</span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">修習學期：</label>
                <select
                  value={addCourseSemesterId}
                  onChange={(e) => setAddCourseSemesterId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  {activeStudent.semesters.map((s) => (
                    <option key={s.semesterId} value={s.semesterId}>
                      {s.semesterName} ({s.semesterId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">科目代碼：</label>
                  <input
                    type="text"
                    value={newCourseId}
                    onChange={(e) => setNewCourseId(e.target.value.toUpperCase())}
                    placeholder="如 CS325"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">學分數：</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={newCourseCredits}
                    onChange={(e) => setNewCourseCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">科目名稱：</label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="例如：雲端架構與微服務"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">修別：</label>
                  <select
                    value={newCourseCategory}
                    onChange={(e) => setNewCourseCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="必修">必修</option>
                    <option value="選修">選修</option>
                    <option value="通識">通識</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">成績分數 (0-100)：</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newCourseScore}
                    onChange={(e) => setNewCourseScore(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddCourseModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  確認新增科目並發布
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: 審核學生證件 Modal */}
      {reviewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">處室證件審查作業</h3>
              <button onClick={() => setReviewingDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">上傳項目</span>
                <span className="font-bold text-slate-900">{reviewingDoc.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">檔案名稱</span>
                <span className="font-mono text-slate-800">{reviewingDoc.fileName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">學生學號</span>
                <span className="font-mono font-bold text-blue-700">{reviewingDoc.studentId}</span>
              </div>

              {reviewingDoc.filePreviewUrl && (
                <div className="my-2 p-2 bg-slate-50 rounded-xl border border-slate-200 flex justify-center">
                  <img
                    src={reviewingDoc.filePreviewUrl}
                    alt="預覽"
                    className="max-h-48 object-contain rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">處室查驗意見備註：</label>
                <input
                  type="text"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="例如：查驗無誤，符合數位學生證二吋規格"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2 text-xs">
              <button
                type="button"
                onClick={() => handleReviewDoc('需補件')}
                className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg font-bold"
              >
                退件要求補正
              </button>
              <button
                type="button"
                onClick={() => handleReviewDoc('已核可')}
                className="px-4 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-bold shadow-xs"
              >
                審查核可通過
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
