import React, { useState } from 'react';
import { 
  StudentProfile, 
  SemesterRecord, 
  UploadedDocument 
} from '../types';
import { 
  maskNationalId, 
  maskPhone, 
  maskAddress, 
  maskEmail, 
  generateVerificationCode,
  logAuditEvent 
} from '../utils/security';
import { downloadTranscriptPdf } from '../utils/pdfGenerator';
import { 
  User, 
  GraduationCap, 
  Award, 
  FileText, 
  Download, 
  CheckCircle2, 
  UploadCloud, 
  Eye, 
  EyeOff, 
  Printer, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Send,
  FileCheck,
  Calendar,
  Sparkles,
  Check
} from 'lucide-react';

interface Props {
  student: StudentProfile;
  onUpdateStudent: (updated: StudentProfile) => void;
  uploadedDocs: UploadedDocument[];
  onUploadDoc: (doc: UploadedDocument) => void;
  onOpenSecurityNotice: () => void;
}

export const StudentPortal: React.FC<Props> = ({
  student,
  onUpdateStudent,
  uploadedDocs,
  onUploadDoc,
  onOpenSecurityNotice,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'grades' | 'transcript' | 'verification' | 'upload'>('grades');
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>(
    student.semesters[0]?.semesterId || '113-1'
  );
  const [maskSensitive, setMaskSensitive] = useState<boolean>(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);

  // 個資校對編輯表單狀態
  const [editPhone, setEditPhone] = useState(student.phone);
  const [editEmail, setEditEmail] = useState(student.email);
  const [editMailingAddress, setEditMailingAddress] = useState(student.mailingAddress);
  const [editEmergencyName, setEditEmergencyName] = useState(student.emergencyContact.name);
  const [editEmergencyPhone, setEditEmergencyPhone] = useState(student.emergencyContact.phone);
  const [confirmSignature, setConfirmSignature] = useState(student.name);
  const [verifyAgreementChecked, setVerifyAgreementChecked] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  // 上傳表單狀態
  const [uploadCategory, setUploadCategory] = useState<UploadedDocument['category']>('學生證相片');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const selectedSemester = student.semesters.find((s) => s.semesterId === selectedSemesterId) || student.semesters[0];

  // 下載成績單 PDF 處理
  const handleDownloadPdf = async () => {
    if (!selectedSemester) return;
    setIsDownloadingPdf(true);

    logAuditEvent({
      operatorRole: 'student',
      operatorName: `${student.name} (學生本人)`,
      targetStudentId: student.studentId,
      targetStudentName: student.name,
      action: '下載成績單PDF',
      securityLevel: '敏感調閱',
      details: `下載 ${selectedSemester.semesterName} (${selectedSemester.semesterId}) 官方成績單 PDF`,
    });

    try {
      await downloadTranscriptPdf('transcript-official-document', student, selectedSemester);
      setDownloadSuccessToast(true);
      setTimeout(() => setDownloadSuccessToast(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // 列印視窗處理
  const handlePrint = () => {
    logAuditEvent({
      operatorRole: 'student',
      operatorName: `${student.name} (學生本人)`,
      targetStudentId: student.studentId,
      targetStudentName: student.name,
      action: '下載成績單PDF',
      securityLevel: '敏感調閱',
      details: `開啟 ${selectedSemester?.semesterName} 成績單列印檢視`,
    });
    window.print();
  };

  // 學生個資校對確認送出
  const handleConfirmProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyAgreementChecked) {
      alert('請先勾選確認個人資料聲明！');
      return;
    }

    const updatedStudent: StudentProfile = {
      ...student,
      phone: editPhone,
      email: editEmail,
      mailingAddress: editMailingAddress,
      emergencyContact: {
        ...student.emergencyContact,
        name: editEmergencyName,
        phone: editEmergencyPhone,
      },
      isProfileConfirmed: true,
      confirmedAt: new Date().toLocaleString('zh-TW', { hour12: false }),
      confirmedSignature: `${confirmSignature} (數位校驗通過)`,
    };

    onUpdateStudent(updatedStudent);

    logAuditEvent({
      operatorRole: 'student',
      operatorName: `${student.name} (學生本人)`,
      targetStudentId: student.studentId,
      targetStudentName: student.name,
      action: '確認個資送出',
      securityLevel: '關鍵變更',
      details: '完成全校學籍個人聯絡資料校對確認，並已簽名存檔留校查驗',
    });

    setVerificationFeedback('✅ 已成功確認並更新個人資料！系統已留存數位安全稽核時間戳。');
    setTimeout(() => setVerificationFeedback(null), 5000);
  };

  // 處理檔案選取
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('檔案大小超過 5MB 限制，請重新選擇較小檔案！');
        return;
      }
      setUploadFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => setUploadPreview(event.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setUploadPreview(null);
      }
    }
  };

  // 處理上傳送出
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('請選擇要上傳的檔案！');
      return;
    }

    const newDoc: UploadedDocument = {
      id: 'DOC-' + Date.now().toString(36).toUpperCase(),
      studentId: student.studentId,
      fileName: uploadFile.name,
      fileSize: `${(uploadFile.size / (1024 * 1024)).toFixed(2)} MB`,
      category: uploadCategory,
      uploadTime: new Date().toLocaleString('zh-TW', { hour12: false }),
      status: '待審核',
      reviewNotes: '已由學生端上傳，待處室管理員查驗核可',
      filePreviewUrl: uploadPreview || undefined,
    };

    onUploadDoc(newDoc);

    // 若上傳的是學生證相片，且有圖片預覽，可同步更新 avatar
    if (uploadCategory === '學生證相片' && uploadPreview) {
      onUpdateStudent({
        ...student,
        avatarUrl: uploadPreview,
      });
    }

    logAuditEvent({
      operatorRole: 'student',
      operatorName: `${student.name} (學生本人)`,
      targetStudentId: student.studentId,
      targetStudentName: student.name,
      action: '上傳個人證件',
      securityLevel: '敏感調閱',
      details: `上傳證件類別: ${uploadCategory}，檔案名稱: ${uploadFile.name}`,
    });

    setUploadFeedback(`✅ 檔案「${uploadFile.name}」已成功上傳送審！`);
    setUploadFile(null);
    setUploadPreview(null);
    setTimeout(() => setUploadFeedback(null), 5000);
  };

  const studentDocs = uploadedDocs.filter((d) => d.studentId === student.studentId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Toast Notification for Download */}
      {downloadSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <div className="text-xs">
            <p className="font-bold">成績單 PDF 下載成功！</p>
            <p className="text-emerald-100">已包含教務處防偽印章與數位驗證編號</p>
          </div>
        </div>
      )}

      {/* Top Profile Card Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Avatar and Basic Info */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div className="relative group">
              <img
                src={student.avatarUrl}
                alt={student.name}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-blue-100"
              />
              <button
                onClick={() => setActiveTab('upload')}
                className="absolute -bottom-1.5 -right-1.5 bg-blue-600 text-white p-1 rounded-full shadow hover:bg-blue-700 transition-colors"
                title="更新照片"
              >
                <UploadCloud className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {student.name}
                </h1>
                <span className="text-xs text-slate-500 font-mono">({student.nameEn})</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  {student.enrollmentStatus}
                </span>

                {student.isProfileConfirmed ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-blue-600" />
                    個資已校對確認
                  </span>
                ) : (
                  <button
                    onClick={() => setActiveTab('verification')}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 animate-bounce"
                  >
                    <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                    請儘速完成個資校對 →
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-600 space-y-0.5">
                <p className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-800">學號：</span>
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-blue-700 font-bold">{student.studentId}</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-semibold text-slate-800">身分證字號：</span>
                  <span className="font-mono text-slate-700">
                    {maskSensitive ? maskNationalId(student.nationalId) : student.nationalId}
                  </span>
                </p>
                <p className="text-slate-500">
                  {student.college} • {student.department} • {student.className} (指導教授：{student.advisor})
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Privacy Mask Toggle */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => setMaskSensitive(!maskSensitive)}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors shadow-2xs"
              title="切換身分證與電話個資遮蔽狀態"
            >
              {maskSensitive ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>顯示完整個資</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>隱蔽個資 (防窺)</span>
                </>
              )}
            </button>

            <button
              onClick={() => setActiveTab('transcript')}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>快速下載成績單</span>
            </button>
          </div>

        </div>

        {/* Graduation Credit Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">畢業應修學分進度：</span>
            <span className="font-semibold text-blue-600">{student.totalCreditsEarned} / {student.graduationRequiredCredits} 學分</span>
            <span className="text-[11px] text-slate-400">
              (達成率 {Math.round((student.totalCreditsEarned / student.graduationRequiredCredits) * 100)}%)
            </span>
          </div>
          <div className="w-full sm:w-64 bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((student.totalCreditsEarned / student.graduationRequiredCredits) * 100))}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* Tabs Navigation (Responsive Mobile & Desktop) */}
      <div className="flex overflow-x-auto space-x-2 pb-1 scrollbar-none border-b border-slate-200">
        <button
          onClick={() => setActiveTab('grades')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'grades'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>學期成績與排名</span>
        </button>

        <button
          onClick={() => setActiveTab('transcript')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'transcript'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>正式成績單下載 (PDF)</span>
          <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
            官方
          </span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>個人學籍詳細檔案</span>
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'verification'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>個資校對確認系統</span>
          {!student.isProfileConfirmed && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'upload'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>上傳證件與相片</span>
          {studentDocs.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {studentDocs.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: 學期成績與排名 */}
      {activeTab === 'grades' && (
        <div className="space-y-6">
          
          {/* Semester Selector Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center space-x-3">
              <label className="text-xs font-bold text-slate-700">選擇查詢學期：</label>
              <select
                value={selectedSemesterId}
                onChange={(e) => setSelectedSemesterId(e.target.value)}
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {student.semesters.map((s) => (
                  <option key={s.semesterId} value={s.semesterId}>
                    {s.semesterName} ({s.semesterId})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>教務處成績登錄狀態：<strong className="text-emerald-600">已正式發布並核定</strong></span>
            </div>
          </div>

          {/* Key KPI Metrics for Selected Semester */}
          {selectedSemester && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">本學期學業平均</span>
                <div className="text-2xl font-black text-blue-600 mt-1 font-mono">
                  {selectedSemester.semesterAverage.toFixed(1)}
                  <span className="text-xs text-slate-400 font-normal ml-1">分</span>
                </div>
                <span className="text-[10px] text-slate-400">滿分 100 分制</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">學期 GPA</span>
                <div className="text-2xl font-black text-indigo-600 mt-1 font-mono">
                  {selectedSemester.semesterGpa.toFixed(2)}
                  <span className="text-xs text-slate-400 font-normal ml-1">/ 4.3</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">等第績分優等</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">班級排名 / 百分比</span>
                <div className="text-2xl font-black text-slate-800 mt-1 font-mono">
                  {selectedSemester.classRank}
                  <span className="text-xs text-slate-400 font-normal ml-1">/ {selectedSemester.classSize}人</span>
                </div>
                <span className="text-[10px] text-blue-600 font-semibold">
                  前 {Math.round((selectedSemester.classRank / selectedSemester.classSize) * 100)}%
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">實得 / 修習學分</span>
                <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                  {selectedSemester.earnedCredits}
                  <span className="text-xs text-slate-400 font-normal ml-1">/ {selectedSemester.semesterCredits}</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">100% 全部及格</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 lg:col-span-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">操行評量 (學務處)</span>
                <div className="text-2xl font-black text-amber-600 mt-1 font-mono">
                  {selectedSemester.conductScore}
                  <span className="text-xs text-slate-600 font-semibold ml-1">({selectedSemester.conductGrade})</span>
                </div>
                <span className="text-[10px] text-slate-400">德育操行紀錄優良</span>
              </div>
            </div>
          )}

          {/* Courses Table */}
          {selectedSemester && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    {selectedSemester.semesterName} 修習科目與成績清單
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  共修習 {selectedSemester.courses.length} 門課程 ({selectedSemester.semesterCredits} 學分)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">項次</th>
                      <th className="py-3 px-4">科目代碼</th>
                      <th className="py-3 px-4">科目名稱 (中文/英文)</th>
                      <th className="py-3 px-4 text-center">學分</th>
                      <th className="py-3 px-4 text-center">類別</th>
                      <th className="py-3 px-4">授課教授</th>
                      <th className="py-3 px-4 text-center">成績分數</th>
                      <th className="py-3 px-4 text-center">等第 / GP</th>
                      <th className="py-3 px-4 text-center">狀態</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSemester.courses.map((course, idx) => (
                      <tr key={course.courseId} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-700">{course.courseId}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{course.courseName}</div>
                          <div className="text-[11px] text-slate-400 font-serif italic">{course.courseNameEn}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-700">
                          {course.credits}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            course.category === '必修'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : course.category === '選修'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {course.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{course.instructor}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900 text-sm">
                          {course.score}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono font-bold text-indigo-700">{course.letterGrade}</span>
                          <span className="text-slate-400 text-[10px] ml-1">({course.gp.toFixed(1)})</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <Check className="w-3 h-3 mr-0.5" /> 及格通過
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Summary */}
              <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                <div>
                  歷年累計實得學分：<strong className="text-slate-900 font-mono">{student.totalCreditsEarned}</strong> 學分
                  <span className="mx-2 text-slate-300">|</span>
                  歷年累計平均 GPA：<strong className="text-slate-900 font-mono">{student.cumulativeGpa.toFixed(2)}</strong>
                </div>
                <div className="text-[11px] text-slate-400">
                  成績計算依本校學生學則第36條規定辦理
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: 正式成績單預覽與下載 (PDF) */}
      {activeTab === 'transcript' && selectedSemester && (
        <div className="space-y-6">
          
          {/* Action Header Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div>
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">官方中英文學期成績通知單 (電子驗證版)</h3>
              </div>
              <p className="text-xs text-blue-200 mt-1">
                本成績單具備教務處專用防偽水印、條碼流水號及防篡改校驗碼，具法律同等效力。
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>直接列印</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="px-5 py-2.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl shadow-md transition-all flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloadingPdf ? '產生 PDF 中...' : '下載個人成績單 PDF'}</span>
              </button>
            </div>
          </div>

          {/* High-Fidelity Printable Official Transcript Document */}
          <div className="bg-slate-200/60 p-2 sm:p-6 rounded-3xl overflow-x-auto flex justify-center">
            
            <div
              id="transcript-official-document"
              className="bg-white w-full max-w-[800px] p-8 sm:p-12 shadow-2xl rounded-xl border border-slate-300 relative text-slate-800 font-sans"
              style={{ minHeight: '1050px' }}
            >
              
              {/* Background Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.035] overflow-hidden">
                <span className="text-9xl font-black rotate-[-35deg] tracking-widest text-slate-900">
                  OFFICIAL TRANSCRIPT
                </span>
              </div>

              {/* School Header */}
              <div className="text-center pb-6 border-b-2 border-slate-800">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <div className="w-10 h-10 rounded-full border-2 border-blue-900 flex items-center justify-center font-bold text-blue-900 text-sm">
                    NSTU
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-widest text-slate-950 font-serif">
                    國立智慧科技大學
                  </h1>
                </div>
                <h2 className="text-sm font-semibold tracking-wide text-slate-600 uppercase font-sans">
                  National Smart Technology University
                </h2>
                <div className="text-base sm:text-lg font-bold text-slate-900 mt-2 tracking-widest">
                  學生學期學業成績通知單 / Official Academic Transcript
                </div>
                <div className="text-xs font-semibold text-slate-600 mt-0.5">
                  【 {selectedSemester.semesterName} 】
                </div>
              </div>

              {/* Student Metadata Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4 py-4 text-xs border-b border-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">學生學號 / Student ID</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{student.studentId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">學生姓名 / Student Name</span>
                  <span className="font-bold text-slate-900 text-sm">{student.name}</span>
                  <span className="block text-[10px] text-slate-500">{student.nameEn}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">就讀學系 / Department</span>
                  <span className="font-bold text-slate-900">{student.department}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">班級年級 / Class & Grade</span>
                  <span className="font-bold text-slate-900">{student.className}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">入學年月 / Enrolled Date</span>
                  <span className="font-mono text-slate-800">{student.enrollmentDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">學籍狀態 / Enrollment Status</span>
                  <span className="font-bold text-emerald-800">{student.enrollmentStatus}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">身分證字號 / ID Number</span>
                  <span className="font-mono text-slate-800">{maskNationalId(student.nationalId)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">核發日期 / Issue Date</span>
                  <span className="font-mono text-slate-800">{new Date().toISOString().split('T')[0]}</span>
                </div>
              </div>

              {/* Course Grade List */}
              <div className="py-4">
                <table className="w-full text-left text-xs border border-slate-400">
                  <thead className="bg-slate-100 border-b border-slate-400 font-bold text-slate-800">
                    <tr>
                      <th className="py-2 px-2.5 border-r border-slate-300 text-center w-10">序號</th>
                      <th className="py-2 px-2.5 border-r border-slate-300 w-20">課程代碼</th>
                      <th className="py-2 px-3 border-r border-slate-300">科目名稱 / Course Title</th>
                      <th className="py-2 px-2 border-r border-slate-300 text-center w-12">學分</th>
                      <th className="py-2 px-2 border-r border-slate-300 text-center w-12">類別</th>
                      <th className="py-2 px-2 border-r border-slate-300 text-center w-16">分數</th>
                      <th className="py-2 px-2 border-r border-slate-300 text-center w-14">等第</th>
                      <th className="py-2 px-2 text-center w-16">判定</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {selectedSemester.courses.map((c, i) => (
                      <tr key={c.courseId} className="hover:bg-slate-50">
                        <td className="py-2 px-2 border-r border-slate-300 text-center font-mono text-slate-500">{i + 1}</td>
                        <td className="py-2 px-2.5 border-r border-slate-300 font-mono text-slate-700">{c.courseId}</td>
                        <td className="py-2 px-3 border-r border-slate-300">
                          <span className="font-semibold text-slate-900">{c.courseName}</span>
                          <span className="block text-[10px] text-slate-500 italic">{c.courseNameEn}</span>
                        </td>
                        <td className="py-2 px-2 border-r border-slate-300 text-center font-mono">{c.credits}</td>
                        <td className="py-2 px-2 border-r border-slate-300 text-center text-[11px]">{c.category}</td>
                        <td className="py-2 px-2 border-r border-slate-300 text-center font-mono font-bold text-slate-900">{c.score}</td>
                        <td className="py-2 px-2 border-r border-slate-300 text-center font-mono font-bold">{c.letterGrade}</td>
                        <td className="py-2 px-2 text-center font-semibold text-emerald-800 text-[11px]">及格</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Statistics */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-6">
                <div>
                  <span className="text-slate-500 block">修習學分 / 實得學分：</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {selectedSemester.semesterCredits} / {selectedSemester.earnedCredits}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">學期學業平均 / GPA：</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {selectedSemester.semesterAverage.toFixed(1)} / {selectedSemester.semesterGpa.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">全班排名 / 百分比：</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    第 {selectedSemester.classRank} 名 (共 {selectedSemester.classSize} 人)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">德育操行成績：</span>
                  <span className="font-mono font-bold text-amber-800 text-sm">
                    {selectedSemester.conductScore} 分 ({selectedSemester.conductGrade})
                  </span>
                </div>
              </div>

              {/* Official Seal and Signatures Section */}
              <div className="pt-4 border-t-2 border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                
                {/* Security Verification Barcode & Code */}
                <div className="space-y-1.5 text-left w-full sm:w-auto">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-slate-800">
                      防偽驗證代碼：
                      <span className="font-mono text-blue-700 ml-1">
                        {generateVerificationCode(student.studentId, selectedSemester.semesterId)}
                      </span>
                    </span>
                  </div>
                  {/* Simulated Barcode */}
                  <div className="w-56 h-8 bg-slate-900 flex items-center justify-between px-2 text-[8px] text-white font-mono tracking-widest select-none">
                    ||||| | |||| ||| || |||||| | ||| || ||||
                  </div>
                  <div className="text-[10px] text-slate-400">
                    本文件採數位電子防偽技術產製，線上掃描查驗即刻驗證真偽。
                  </div>
                </div>

                {/* University Red Seal & Registrar Stamp */}
                <div className="flex items-center space-x-6">
                  {/* Registrar Seal */}
                  <div className="w-24 h-24 border-2 border-rose-700 rounded-lg p-1.5 flex flex-col items-center justify-center text-center text-rose-700 transform rotate-[-3deg] select-none shadow-xs">
                    <span className="text-[10px] font-bold border-b border-rose-300 pb-0.5 w-full">教務處註冊組</span>
                    <span className="text-xs font-black my-1 font-serif">成績核發章</span>
                    <span className="text-[9px] font-mono">{new Date().toISOString().split('T')[0]}</span>
                  </div>

                  {/* University Round Seal */}
                  <div className="w-24 h-24 border-3 border-rose-700 rounded-full p-1 flex flex-col items-center justify-center text-center text-rose-700 select-none shadow-xs">
                    <div className="w-full h-full border border-dashed border-rose-500 rounded-full flex flex-col items-center justify-center p-1">
                      <span className="text-[9px] font-bold">國立智慧科技大學</span>
                      <span className="text-[11px] font-black font-serif my-0.5">教務處之印</span>
                      <span className="text-[8px] font-mono">OFFICIAL SEAL</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Legal Notice */}
              <div className="mt-8 pt-2 text-center text-[10px] text-slate-400 border-t border-slate-200">
                本文件受個人資料保護法及智慧財產權法保護。未經學校授權之偽造、變造或行使偽造變造者，依法追究刑事責任。
              </div>

            </div>

          </div>

        </div>
      )}

      {/* TAB 3: 個人學籍詳細檔案 */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: 學籍基本資料 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">教務處學籍註冊檔案</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">學號 (Student ID)</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{student.studentId}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">中文姓名 / 英文姓名</span>
                <span className="font-bold text-slate-900">{student.name}</span>
                <span className="block text-[11px] text-slate-500">{student.nameEn}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">性別 / 生日</span>
                <span className="text-slate-800">{student.gender} • {maskSensitive ? '2004-**-**' : student.birthDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">身分證字號</span>
                <span className="font-mono text-slate-800">
                  {maskSensitive ? maskNationalId(student.nationalId) : student.nationalId}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">學院 / 學系</span>
                <span className="font-semibold text-slate-800">{student.college}</span>
                <span className="block text-slate-600">{student.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">班級 / 年級</span>
                <span className="font-semibold text-slate-800">{student.className} (大{student.gradeLevel})</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">就讀導師 (Advisor)</span>
                <span className="text-slate-800">{student.advisor}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">入學年月 / 在學狀態</span>
                <span className="font-mono text-slate-800">{student.enrollmentDate}</span>
                <span className="ml-1 text-emerald-600 font-bold">({student.enrollmentStatus})</span>
              </div>
            </div>
          </div>

          {/* Card 2: 通訊與緊急聯絡 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">通訊地址與生活緊急聯絡網</h3>
              </div>
              <button
                onClick={() => setActiveTab('verification')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold underline"
              >
                線上申請變更 →
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 flex items-center space-x-1 mb-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>行動電話 (Mobile Phone)</span>
                </span>
                <span className="font-mono text-slate-800 text-sm font-semibold">
                  {maskSensitive ? maskPhone(student.phone) : student.phone}
                </span>
              </div>

              <div>
                <span className="text-slate-400 flex items-center space-x-1 mb-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>學生學校電子郵件</span>
                </span>
                <span className="font-mono text-slate-800">
                  {maskSensitive ? maskEmail(student.email) : student.email}
                </span>
              </div>

              <div>
                <span className="text-slate-400 flex items-center space-x-1 mb-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>通訊寄件地址 (Mailing Address)</span>
                </span>
                <span className="text-slate-800">
                  {maskSensitive ? maskAddress(student.mailingAddress) : student.mailingAddress}
                </span>
              </div>

              <div>
                <span className="text-slate-400 flex items-center space-x-1 mb-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>戶籍登記地址 (Permanent Address)</span>
                </span>
                <span className="text-slate-800">
                  {maskSensitive ? maskAddress(student.permanentAddress) : student.permanentAddress}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                <span className="text-[11px] font-bold text-amber-900 block mb-1">
                  緊急聯絡人 (Emergency Contact)
                </span>
                <div className="flex items-center justify-between text-xs text-amber-950">
                  <span>{student.emergencyContact.name} ({student.emergencyContact.relationship})</span>
                  <span className="font-mono font-bold">
                    {maskSensitive ? maskPhone(student.emergencyContact.phone) : student.emergencyContact.phone}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: 學務處獎懲與操行記錄 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 md:col-span-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-800 text-sm">學務處生活輔導與獎懲紀錄</h3>
              </div>
              <span className="text-xs text-slate-500">
                出缺勤出席率：<strong className="text-emerald-600 font-mono">{student.attendance.attendanceRate}%</strong> (曠課：0 小時)
              </span>
            </div>

            <div className="space-y-2">
              {student.disciplinaryRecords.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">在校期間生活規矩良好，無任何懲處紀錄</p>
              ) : (
                student.disciplinaryRecords.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs gap-2"
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                        d.type === '獎勵' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {d.category}
                      </span>
                      <span className="font-medium text-slate-800">{d.reason}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
                      <span className="font-mono">{d.date}</span>
                      <span>核定：{d.approvalOffice}</span>
                      <span className="text-emerald-600 font-semibold">({d.status})</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: 個資校對確認系統 (Profile Verification) */}
      {activeTab === 'verification' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">113學年度 學生學籍個人資料線上校對確認系統</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              為確保學籍權益、緊急事件聯絡及畢業證書製發通訊正確，依教育部學籍管理規定，請各位同學於每學期線上核對確認個人基本資料。
            </p>
          </div>

          {verificationFeedback && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center space-x-2 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="font-semibold">{verificationFeedback}</div>
            </div>
          )}

          {student.isProfileConfirmed && (
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <div>
                  <span className="font-bold">您已於 {student.confirmedAt} 完成個資線上校對</span>
                  <p className="text-[11px] text-blue-700">數位簽章憑證：{student.confirmedSignature}</p>
                </div>
              </div>
              <span className="text-[10px] bg-blue-200/80 text-blue-800 font-bold px-2.5 py-1 rounded-full">
                有效留存
              </span>
            </div>
          )}

          <form onSubmit={handleConfirmProfile} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Readonly Core Info */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  🔒 教務處法定學籍欄位 (不可自行變更，需檢具戶籍謄本親洽教務處)
                </span>
                <div className="text-xs space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">學生學號</span>
                    <span className="font-mono font-bold text-slate-800">{student.studentId}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">姓名</span>
                    <span className="font-bold text-slate-800">{student.name} ({student.gender})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">身分證字號</span>
                    <span className="font-mono text-slate-800">{maskNationalId(student.nationalId)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">出生年月日</span>
                    <span className="font-mono text-slate-800">{student.birthDate}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">系所班級</span>
                    <span className="text-slate-800">{student.department} {student.className}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">戶籍地地址</span>
                    <span className="text-slate-800">{student.permanentAddress}</span>
                  </div>
                </div>
              </div>

              {/* Editable Contact Info */}
              <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-blue-700 block mb-2">
                  ✏️ 可線上核對與即時更正之通訊資訊
                </span>
                
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">行動電話：</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">電子郵件信箱：</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">通訊寄件地址 (收取成績單或重要通知)：</label>
                  <input
                    type="text"
                    value={editMailingAddress}
                    onChange={(e) => setEditMailingAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">緊急聯絡人姓名：</label>
                    <input
                      type="text"
                      value={editEmergencyName}
                      onChange={(e) => setEditEmergencyName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">緊急聯絡人電話：</label>
                    <input
                      type="text"
                      value={editEmergencyPhone}
                      onChange={(e) => setEditEmergencyPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Signature & Confirmation Agreement */}
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200 space-y-3">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifyAgreementChecked}
                  onChange={(e) => setVerifyAgreementChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  required
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  <strong>本人聲明：</strong>已詳細審閱並核對上述個人學籍資料與通訊資訊，保證所填各項內容均確實無誤。若有異動將即時主動告知學校辦理變更。
                </span>
              </label>

              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
                <span className="text-xs font-bold text-slate-700">學生線上數位簽名確認：</span>
                <input
                  type="text"
                  value={confirmSignature}
                  onChange={(e) => setConfirmSignature(e.target.value)}
                  placeholder="請輸入繁體中文全名"
                  className="px-3.5 py-1.5 text-xs font-bold text-blue-900 bg-white border border-slate-300 rounded-xl max-w-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!verifyAgreementChecked}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>簽署並送出個人資料校對確認</span>
              </button>
            </div>

          </form>

        </div>
      )}

      {/* TAB 5: 上傳個人資料與證件 (Upload Documents) */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          
          {/* Upload Form Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <UploadCloud className="w-6 h-6 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">學生證件與證明文件線上上傳系統</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                支援格式：JPG, PNG, PDF (單一檔案大小上限 5MB)，上傳後將加密存儲並送交各權責處室查驗。
              </p>
            </div>

            {uploadFeedback && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center space-x-2 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="font-semibold">{uploadFeedback}</div>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    請選擇上傳項目類別 <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as UploadedDocument['category'])}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="學生證相片">學生證大頭照 (二吋白底脫帽相片)</option>
                    <option value="身分證正面">國民身分證 正面影本 (個資查驗)</option>
                    <option value="身分證反面">國民身分證 反面影本</option>
                    <option value="英語檢定證書">外語能力檢定證書 (畢業門檻審查)</option>
                    <option value="特殊身分證明">減免學雜費 / 弱勢助學證明文件</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    選取檔案 (支援 JPG / PNG / PDF) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Image Preview Box if applicable */}
              {uploadPreview && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-4">
                  <img
                    src={uploadPreview}
                    alt="預覽"
                    className="w-16 h-16 object-cover rounded-lg border border-slate-300 shadow-xs"
                  />
                  <div className="text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">{uploadFile?.name}</p>
                    <p className="text-[11px] text-slate-400">
                      檔案大小：{uploadFile ? (uploadFile.size / (1024 * 1024)).toFixed(2) : 0} MB
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium">✓ 格式校驗正確，符合上傳標準</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  🔒 所有上傳文件均自動加上隱形防偽時間戳，防範未經授權之散布
                </span>
                <button
                  type="submit"
                  disabled={!uploadFile}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>立即安全上傳</span>
                </button>
              </div>

            </form>
          </div>

          {/* Uploaded Documents History */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">已上傳檔案與處室審核狀態</h4>
            
            {studentDocs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">目前尚無已上傳文件</p>
            ) : (
              <div className="space-y-2.5">
                {studentDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs gap-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{doc.fileName}</span>
                          <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded font-medium">
                            {doc.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          上傳時間：{doc.uploadTime} • 檔案大小：{doc.fileSize}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-center">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        doc.status === '已核可'
                          ? 'bg-emerald-100 text-emerald-800'
                          : doc.status === '待審核'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {doc.status}
                      </span>
                      {doc.reviewNotes && (
                        <span className="text-[11px] text-slate-500 italic hidden md:inline">
                          ({doc.reviewNotes})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
