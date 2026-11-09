export type RoleType = 'student' | 'academic_affairs' | 'student_affairs' | 'system_admin';

export interface CourseGrade {
  courseId: string;
  courseName: string;
  courseNameEn: string;
  credits: number;
  category: '必修' | '選修' | '通識';
  score: number;
  letterGrade: string;
  gp: number; // Grade Point e.g. 4.0
  passed: boolean;
  instructor: string;
}

export interface SemesterRecord {
  semesterId: string; // e.g. "112-1", "112-2", "113-1"
  semesterName: string; // e.g. "112學年度第1學期"
  academicYear: string;
  semesterTerm: '上學期' | '下學期';
  courses: CourseGrade[];
  semesterCredits: number;
  earnedCredits: number;
  semesterAverage: number;
  semesterGpa: number;
  classRank: number;
  classSize: number;
  departmentRank: number;
  departmentSize: number;
  conductScore: number; // 操行成績
  conductGrade: string; // 甲、優
}

export interface DisciplinaryRecord {
  id: string;
  date: string;
  type: '獎勵' | '懲戒';
  category: '嘉獎' | '小功' | '大功' | '警告' | '小過' | '大過';
  reason: string;
  approvalOffice: '學務處' | '系所評議會';
  status: '生效' | '已銷過' | '審核中';
}

export interface AttendanceRecord {
  leaveDays: number;
  sickLeaveDays: number;
  officialLeaveDays: number;
  truancyHours: number; // 曠課
  attendanceRate: number; // %
}

export interface StudentProfile {
  studentId: string; // 學號 e.g. "S1121001"
  nationalId: string; // 身分證字號 e.g. "A123456789"
  name: string;
  nameEn: string;
  gender: '男' | '女';
  birthDate: string;
  college: string; // 學院
  department: string; // 學系
  gradeLevel: number; // 年級
  className: string; // 班級
  advisor: string; // 導師
  enrollmentStatus: '在學' | '休學' | '畢業' | '保留學籍';
  enrollmentDate: string; // 入學日期
  email: string;
  phone: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  mailingAddress: string;
  permanentAddress: string;
  avatarUrl: string;
  
  // 個資確認狀態
  isProfileConfirmed: boolean;
  confirmedAt?: string;
  confirmedSignature?: string;
  pendingProfileUpdate?: Partial<StudentProfile>;
  
  // 成績與學分
  semesters: SemesterRecord[];
  totalCreditsEarned: number;
  graduationRequiredCredits: number;
  cumulativeGpa: number;
  cumulativeAverage: number;

  // 學務處資料
  disciplinaryRecords: DisciplinaryRecord[];
  attendance: AttendanceRecord;

  /** 教務／處室核發的個人通行碼（模擬考、英檢報名等） */
  accessCodes?: AccessCode[];
}

export type AccessCodeType = 'mock_exam' | 'english_test' | 'event' | 'other';

export interface AccessCode {
  id: string;
  codeType: AccessCodeType;
  label: string; // 例如：113-1 第一次模擬考
  password: string;
  updatedAt?: string;
  note?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  operatorRole: RoleType;
  operatorName: string;
  targetStudentId: string;
  targetStudentName: string;
  action: '登入驗證' | '查詢個人資料' | '下載成績單PDF' | '確認個資送出' | '上傳個人證件' | '教務處成績修改' | '學務處查閱操行' | '資安遮罩調整' | '匯入學籍資料';
  ipAddress: string;
  deviceInfo: string;
  securityLevel: '常規' | '敏感調閱' | '關鍵變更';
  details: string;
}

export interface UploadedDocument {
  id: string;
  studentId: string;
  fileName: string;
  fileSize: string;
  category: '學生證相片' | '身分證正面' | '身分證反面' | '特殊身分證明' | '英語檢定證書';
  uploadTime: string;
  status: '待審核' | '已核可' | '需補件';
  filePreviewUrl?: string;
  reviewNotes?: string;
}
