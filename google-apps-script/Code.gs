/**
 * 高雄市立中正高工 · Google 試算表後端 API
 *
 * ========== 部署步驟 ==========
 * 1. 新建 Google 試算表，名稱例如「校務學生資料庫」
 * 2. 擴充功能 → Apps Script，貼上本檔全部內容並儲存
 * 3. 部署 → 新部署 → 類型選「網頁應用程式」
 *    - 執行身分：我
 *    - 具有存取權的使用者：任何人
 * 4. 授權後複製「網頁應用程式網址」
 * 5. 貼到專案根目錄 .env.local：
 *    VITE_SHEETS_API_URL=你的網頁應用程式網址
 * 6. 重新 npm run dev；前端會自動載入，若表是空的可一鍵寫入範例資料
 *
 * 工作表（自動建立）：
 * 學籍 / 學期彙總 / 成績科目 / 獎懲 / 出缺勤 / 通行碼 / 文件審核 / 稽核日誌 / 處室帳號
 *
 * 處室帳號欄位：username, password, role, displayName, enabled
 * role 可用：academic_affairs（教務）/ student_affairs（學務）/ system_admin（系統）
 * 表為空時會自動寫入三組預設帳號，可直接在試算表改密碼。
 */

var SHEET_NAMES = {
  students: '學籍',
  semesters: '學期彙總',
  courses: '成績科目',
  discipline: '獎懲',
  attendance: '出缺勤',
  accessCodes: '通行碼',
  documents: '文件審核',
  audit: '稽核日誌',
  adminAccounts: '處室帳號',
};

var DEFAULT_ADMIN_ACCOUNTS = [
  {
    username: 'academic',
    password: 'CcvsAcad113',
    role: 'academic_affairs',
    displayName: '教務處註冊組',
    enabled: true,
  },
  {
    username: 'studentaffairs',
    password: 'CcvsStu113',
    role: 'student_affairs',
    displayName: '學務處生輔組',
    enabled: true,
  },
  {
    username: 'admin',
    password: 'CcvsAdmin113',
    role: 'system_admin',
    displayName: '系統與資安管理員',
    enabled: true,
  },
];

function doGet(e) {
  try {
    ensureSheets_();
    var action = (e && e.parameter && e.parameter.action) || 'getAll';
    if (action === 'ping') {
      return json_({ ok: true, message: 'sheets api ready' });
    }
    if (action === 'getAll') {
      return json_({ ok: true, data: readAll_() });
    }
    return json_({ ok: false, error: 'unknown action: ' + action });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    ensureSheets_();
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    var action = body.action || 'saveAll';

    if (action === 'saveAll') {
      writeAll_(body.data || {});
      return json_({ ok: true, message: 'saved' });
    }
    if (action === 'seed') {
      writeAll_(body.data || {});
      return json_({ ok: true, message: 'seeded' });
    }
    if (action === 'getAll') {
      return json_({ ok: true, data: readAll_() });
    }
    return json_({ ok: false, error: 'unknown action: ' + action });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ensureSheets_() {
  var ss = ss_();
  var specs = [
    [
      SHEET_NAMES.students,
      [
        'studentId',
        'nationalId',
        'name',
        'nameEn',
        'gender',
        'birthDate',
        'college',
        'department',
        'gradeLevel',
        'className',
        'advisor',
        'enrollmentStatus',
        'enrollmentDate',
        'email',
        'phone',
        'emergencyName',
        'emergencyRelationship',
        'emergencyPhone',
        'mailingAddress',
        'permanentAddress',
        'avatarUrl',
        'isProfileConfirmed',
        'confirmedAt',
        'confirmedSignature',
        'totalCreditsEarned',
        'graduationRequiredCredits',
        'cumulativeGpa',
        'cumulativeAverage',
      ],
    ],
    [
      SHEET_NAMES.semesters,
      [
        'studentId',
        'semesterId',
        'semesterName',
        'academicYear',
        'semesterTerm',
        'semesterCredits',
        'earnedCredits',
        'semesterAverage',
        'semesterGpa',
        'classRank',
        'classSize',
        'departmentRank',
        'departmentSize',
        'conductScore',
        'conductGrade',
      ],
    ],
    [
      SHEET_NAMES.courses,
      [
        'studentId',
        'semesterId',
        'courseId',
        'courseName',
        'courseNameEn',
        'credits',
        'category',
        'score',
        'letterGrade',
        'gp',
        'passed',
        'instructor',
      ],
    ],
    [
      SHEET_NAMES.discipline,
      ['id', 'studentId', 'date', 'type', 'category', 'reason', 'approvalOffice', 'status'],
    ],
    [
      SHEET_NAMES.attendance,
      [
        'studentId',
        'leaveDays',
        'sickLeaveDays',
        'officialLeaveDays',
        'truancyHours',
        'attendanceRate',
      ],
    ],
    [
      SHEET_NAMES.accessCodes,
      ['id', 'studentId', 'codeType', 'label', 'password', 'updatedAt', 'note'],
    ],
    [
      SHEET_NAMES.documents,
      [
        'id',
        'studentId',
        'fileName',
        'fileSize',
        'category',
        'uploadTime',
        'status',
        'filePreviewUrl',
        'reviewNotes',
      ],
    ],
    [
      SHEET_NAMES.audit,
      [
        'id',
        'timestamp',
        'operatorRole',
        'operatorName',
        'targetStudentId',
        'targetStudentName',
        'action',
        'ipAddress',
        'deviceInfo',
        'securityLevel',
        'details',
      ],
    ],
    [
      SHEET_NAMES.adminAccounts,
      ['username', 'password', 'role', 'displayName', 'enabled'],
    ],
  ];

  specs.forEach(function (spec) {
    var name = spec[0];
    var headers = spec[1];
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    } else if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }
  });

  // 處室帳號表為空時寫入預設帳密，方便學校直接在試算表修改
  seedAdminAccountsIfEmpty_();

  // 移除預設「工作表1」若已有我們的表
  var def = ss.getSheetByName('工作表1');
  if (def && ss.getSheets().length > 1) {
    ss.deleteSheet(def);
  }
}

function seedAdminAccountsIfEmpty_() {
  var rows = readRows_(SHEET_NAMES.adminAccounts);
  if (rows.length > 0) return;
  writeRows_(
    SHEET_NAMES.adminAccounts,
    ['username', 'password', 'role', 'displayName', 'enabled'],
    DEFAULT_ADMIN_ACCOUNTS
  );
}

function normalizeAdminRole_(raw) {
  var v = String(raw || '')
    .trim()
    .toLowerCase();
  if (v === 'academic_affairs' || v === 'academic' || v === '教務' || v === '教務處') {
    return 'academic_affairs';
  }
  if (
    v === 'student_affairs' ||
    v === 'studentaffairs' ||
    v === '學務' ||
    v === '學務處'
  ) {
    return 'student_affairs';
  }
  if (
    v === 'system_admin' ||
    v === 'admin' ||
    v === '系統' ||
    v === '系統管理' ||
    v === '系統管理員'
  ) {
    return 'system_admin';
  }
  return '';
}

function readAdminAccounts_() {
  return readRows_(SHEET_NAMES.adminAccounts)
    .map(function (a) {
      var username = String(a.username || '').trim();
      var password = String(a.password || '');
      var role = normalizeAdminRole_(a.role);
      var displayName = String(a.displayName || '').trim();
      var enabled = a.enabled === '' || a.enabled === null || a.enabled === undefined
        ? true
        : toBool_(a.enabled);
      if (!username || !password || !role) return null;
      return {
        username: username,
        password: password,
        role: role,
        displayName: displayName || username,
        enabled: enabled,
      };
    })
    .filter(function (a) {
      return !!a;
    });
}

function sheet_(name) {
  return ss_().getSheetByName(name);
}

function readRows_(sheetName) {
  var sheet = sheet_(sheetName);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function (h) {
    return String(h).trim();
  });
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row.every(function (c) {
      return c === '' || c === null;
    })) {
      continue;
    }
    var obj = {};
    headers.forEach(function (h, idx) {
      obj[h] = row[idx];
    });
    rows.push(obj);
  }
  return rows;
}

function clearData_(sheetName) {
  var sheet = sheet_(sheetName);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
}

function writeRows_(sheetName, headers, rows) {
  var sheet = sheet_(sheetName);
  clearData_(sheetName);
  if (!rows || !rows.length) return;
  var matrix = rows.map(function (r) {
    return headers.map(function (h) {
      var v = r[h];
      if (v === undefined || v === null) return '';
      if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
      return v;
    });
  });
  sheet.getRange(2, 1, matrix.length, headers.length).setValues(matrix);
}

function toBool_(v) {
  if (typeof v === 'boolean') return v;
  var s = String(v).toUpperCase();
  return s === 'TRUE' || s === '1' || s === 'YES' || s === '是';
}

function toNum_(v, fallback) {
  if (v === '' || v === null || v === undefined) return fallback;
  var n = Number(v);
  return isNaN(n) ? fallback : n;
}

function readAll_() {
  var studentRows = readRows_(SHEET_NAMES.students);
  var semesterRows = readRows_(SHEET_NAMES.semesters);
  var courseRows = readRows_(SHEET_NAMES.courses);
  var disciplineRows = readRows_(SHEET_NAMES.discipline);
  var attendanceRows = readRows_(SHEET_NAMES.attendance);
  var accessCodeRows = readRows_(SHEET_NAMES.accessCodes);
  var documentRows = readRows_(SHEET_NAMES.documents);
  var auditRows = readRows_(SHEET_NAMES.audit);

  var students = studentRows.map(function (s) {
    var sid = String(s.studentId).trim();
    var semesters = semesterRows
      .filter(function (sem) {
        return String(sem.studentId).trim() === sid;
      })
      .map(function (sem) {
        var semesterId = String(sem.semesterId).trim();
        var courses = courseRows
          .filter(function (c) {
            return (
              String(c.studentId).trim() === sid &&
              String(c.semesterId).trim() === semesterId
            );
          })
          .map(function (c) {
            return {
              courseId: String(c.courseId),
              courseName: String(c.courseName),
              courseNameEn: String(c.courseNameEn || ''),
              credits: toNum_(c.credits, 0),
              category: String(c.category || '必修'),
              score: toNum_(c.score, 0),
              letterGrade: String(c.letterGrade || ''),
              gp: toNum_(c.gp, 0),
              passed: toBool_(c.passed),
              instructor: String(c.instructor || ''),
            };
          });
        return {
          semesterId: semesterId,
          semesterName: String(sem.semesterName || ''),
          academicYear: String(sem.academicYear || ''),
          semesterTerm: String(sem.semesterTerm || '上學期'),
          semesterCredits: toNum_(sem.semesterCredits, 0),
          earnedCredits: toNum_(sem.earnedCredits, 0),
          semesterAverage: toNum_(sem.semesterAverage, 0),
          semesterGpa: toNum_(sem.semesterGpa, 0),
          classRank: toNum_(sem.classRank, 0),
          classSize: toNum_(sem.classSize, 0),
          departmentRank: toNum_(sem.departmentRank, 0),
          departmentSize: toNum_(sem.departmentSize, 0),
          conductScore: toNum_(sem.conductScore, 0),
          conductGrade: String(sem.conductGrade || ''),
          courses: courses,
        };
      });

    var disciplinaryRecords = disciplineRows
      .filter(function (d) {
        return String(d.studentId).trim() === sid;
      })
      .map(function (d) {
        return {
          id: String(d.id),
          date: String(d.date),
          type: String(d.type || '獎勵'),
          category: String(d.category || '嘉獎'),
          reason: String(d.reason || ''),
          approvalOffice: String(d.approvalOffice || '學務處'),
          status: String(d.status || '生效'),
        };
      });

    var att =
      attendanceRows.filter(function (a) {
        return String(a.studentId).trim() === sid;
      })[0] || {};

    var accessCodes = accessCodeRows
      .filter(function (c) {
        return String(c.studentId).trim() === sid;
      })
      .map(function (c) {
        return {
          id: String(c.id || ''),
          codeType: String(c.codeType || 'other'),
          label: String(c.label || ''),
          password: String(c.password || ''),
          updatedAt: c.updatedAt ? String(c.updatedAt) : undefined,
          note: c.note ? String(c.note) : undefined,
        };
      });

    return {
      studentId: sid,
      nationalId: String(s.nationalId || ''),
      name: String(s.name || ''),
      nameEn: String(s.nameEn || ''),
      gender: String(s.gender || '男'),
      birthDate: String(s.birthDate || ''),
      college: String(s.college || ''),
      department: String(s.department || ''),
      gradeLevel: toNum_(s.gradeLevel, 1),
      className: String(s.className || ''),
      advisor: String(s.advisor || ''),
      enrollmentStatus: String(s.enrollmentStatus || '在學'),
      enrollmentDate: String(s.enrollmentDate || ''),
      email: String(s.email || ''),
      phone: String(s.phone || ''),
      emergencyContact: {
        name: String(s.emergencyName || ''),
        relationship: String(s.emergencyRelationship || ''),
        phone: String(s.emergencyPhone || ''),
      },
      mailingAddress: String(s.mailingAddress || ''),
      permanentAddress: String(s.permanentAddress || ''),
      avatarUrl: String(s.avatarUrl || ''),
      isProfileConfirmed: toBool_(s.isProfileConfirmed),
      confirmedAt: s.confirmedAt ? String(s.confirmedAt) : undefined,
      confirmedSignature: s.confirmedSignature ? String(s.confirmedSignature) : undefined,
      totalCreditsEarned: toNum_(s.totalCreditsEarned, 0),
      graduationRequiredCredits: toNum_(s.graduationRequiredCredits, 128),
      cumulativeGpa: toNum_(s.cumulativeGpa, 0),
      cumulativeAverage: toNum_(s.cumulativeAverage, 0),
      semesters: semesters,
      disciplinaryRecords: disciplinaryRecords,
      attendance: {
        leaveDays: toNum_(att.leaveDays, 0),
        sickLeaveDays: toNum_(att.sickLeaveDays, 0),
        officialLeaveDays: toNum_(att.officialLeaveDays, 0),
        truancyHours: toNum_(att.truancyHours, 0),
        attendanceRate: toNum_(att.attendanceRate, 100),
      },
      accessCodes: accessCodes,
    };
  });

  var documents = documentRows.map(function (d) {
    return {
      id: String(d.id),
      studentId: String(d.studentId),
      fileName: String(d.fileName || ''),
      fileSize: String(d.fileSize || ''),
      category: String(d.category || '學生證相片'),
      uploadTime: String(d.uploadTime || ''),
      status: String(d.status || '待審核'),
      filePreviewUrl: d.filePreviewUrl ? String(d.filePreviewUrl) : undefined,
      reviewNotes: d.reviewNotes ? String(d.reviewNotes) : undefined,
    };
  });

  var auditLogs = auditRows.map(function (a) {
    return {
      id: String(a.id),
      timestamp: String(a.timestamp || ''),
      operatorRole: String(a.operatorRole || 'system_admin'),
      operatorName: String(a.operatorName || ''),
      targetStudentId: String(a.targetStudentId || ''),
      targetStudentName: String(a.targetStudentName || ''),
      action: String(a.action || '查詢個人資料'),
      ipAddress: String(a.ipAddress || ''),
      deviceInfo: String(a.deviceInfo || ''),
      securityLevel: String(a.securityLevel || '常規'),
      details: String(a.details || ''),
    };
  });

  var adminAccounts = readAdminAccounts_();

  return {
    students: students,
    documents: documents,
    auditLogs: auditLogs,
    adminAccounts: adminAccounts,
  };
}

function writeAll_(data) {
  var students = data.students || [];
  var documents = data.documents || [];
  var auditLogs = data.auditLogs || [];
  // 舊前端若未帶 adminAccounts，保留試算表既有帳號，避免被清空
  var hasAdminAccountsField = Object.prototype.hasOwnProperty.call(
    data,
    'adminAccounts'
  );
  var adminAccounts = hasAdminAccountsField
    ? data.adminAccounts || []
    : null;

  var studentHeaders = [
    'studentId',
    'nationalId',
    'name',
    'nameEn',
    'gender',
    'birthDate',
    'college',
    'department',
    'gradeLevel',
    'className',
    'advisor',
    'enrollmentStatus',
    'enrollmentDate',
    'email',
    'phone',
    'emergencyName',
    'emergencyRelationship',
    'emergencyPhone',
    'mailingAddress',
    'permanentAddress',
    'avatarUrl',
    'isProfileConfirmed',
    'confirmedAt',
    'confirmedSignature',
    'totalCreditsEarned',
    'graduationRequiredCredits',
    'cumulativeGpa',
    'cumulativeAverage',
  ];
  var semesterHeaders = [
    'studentId',
    'semesterId',
    'semesterName',
    'academicYear',
    'semesterTerm',
    'semesterCredits',
    'earnedCredits',
    'semesterAverage',
    'semesterGpa',
    'classRank',
    'classSize',
    'departmentRank',
    'departmentSize',
    'conductScore',
    'conductGrade',
  ];
  var courseHeaders = [
    'studentId',
    'semesterId',
    'courseId',
    'courseName',
    'courseNameEn',
    'credits',
    'category',
    'score',
    'letterGrade',
    'gp',
    'passed',
    'instructor',
  ];
  var disciplineHeaders = [
    'id',
    'studentId',
    'date',
    'type',
    'category',
    'reason',
    'approvalOffice',
    'status',
  ];
  var attendanceHeaders = [
    'studentId',
    'leaveDays',
    'sickLeaveDays',
    'officialLeaveDays',
    'truancyHours',
    'attendanceRate',
  ];
  var accessCodeHeaders = [
    'id',
    'studentId',
    'codeType',
    'label',
    'password',
    'updatedAt',
    'note',
  ];
  var documentHeaders = [
    'id',
    'studentId',
    'fileName',
    'fileSize',
    'category',
    'uploadTime',
    'status',
    'filePreviewUrl',
    'reviewNotes',
  ];
  var auditHeaders = [
    'id',
    'timestamp',
    'operatorRole',
    'operatorName',
    'targetStudentId',
    'targetStudentName',
    'action',
    'ipAddress',
    'deviceInfo',
    'securityLevel',
    'details',
  ];
  var adminAccountHeaders = [
    'username',
    'password',
    'role',
    'displayName',
    'enabled',
  ];

  var studentFlat = [];
  var semesterFlat = [];
  var courseFlat = [];
  var disciplineFlat = [];
  var attendanceFlat = [];
  var accessCodeFlat = [];

  students.forEach(function (s) {
    studentFlat.push({
      studentId: s.studentId,
      nationalId: s.nationalId,
      name: s.name,
      nameEn: s.nameEn,
      gender: s.gender,
      birthDate: s.birthDate,
      college: s.college,
      department: s.department,
      gradeLevel: s.gradeLevel,
      className: s.className,
      advisor: s.advisor,
      enrollmentStatus: s.enrollmentStatus,
      enrollmentDate: s.enrollmentDate,
      email: s.email,
      phone: s.phone,
      emergencyName: (s.emergencyContact && s.emergencyContact.name) || '',
      emergencyRelationship: (s.emergencyContact && s.emergencyContact.relationship) || '',
      emergencyPhone: (s.emergencyContact && s.emergencyContact.phone) || '',
      mailingAddress: s.mailingAddress,
      permanentAddress: s.permanentAddress,
      avatarUrl: s.avatarUrl,
      isProfileConfirmed: !!s.isProfileConfirmed,
      confirmedAt: s.confirmedAt || '',
      confirmedSignature: s.confirmedSignature || '',
      totalCreditsEarned: s.totalCreditsEarned,
      graduationRequiredCredits: s.graduationRequiredCredits,
      cumulativeGpa: s.cumulativeGpa,
      cumulativeAverage: s.cumulativeAverage,
    });

    (s.semesters || []).forEach(function (sem) {
      semesterFlat.push({
        studentId: s.studentId,
        semesterId: sem.semesterId,
        semesterName: sem.semesterName,
        academicYear: sem.academicYear,
        semesterTerm: sem.semesterTerm,
        semesterCredits: sem.semesterCredits,
        earnedCredits: sem.earnedCredits,
        semesterAverage: sem.semesterAverage,
        semesterGpa: sem.semesterGpa,
        classRank: sem.classRank,
        classSize: sem.classSize,
        departmentRank: sem.departmentRank,
        departmentSize: sem.departmentSize,
        conductScore: sem.conductScore,
        conductGrade: sem.conductGrade,
      });
      (sem.courses || []).forEach(function (c) {
        courseFlat.push({
          studentId: s.studentId,
          semesterId: sem.semesterId,
          courseId: c.courseId,
          courseName: c.courseName,
          courseNameEn: c.courseNameEn,
          credits: c.credits,
          category: c.category,
          score: c.score,
          letterGrade: c.letterGrade,
          gp: c.gp,
          passed: !!c.passed,
          instructor: c.instructor,
        });
      });
    });

    (s.disciplinaryRecords || []).forEach(function (d) {
      disciplineFlat.push({
        id: d.id,
        studentId: s.studentId,
        date: d.date,
        type: d.type,
        category: d.category,
        reason: d.reason,
        approvalOffice: d.approvalOffice,
        status: d.status,
      });
    });

    var att = s.attendance || {};
    attendanceFlat.push({
      studentId: s.studentId,
      leaveDays: att.leaveDays || 0,
      sickLeaveDays: att.sickLeaveDays || 0,
      officialLeaveDays: att.officialLeaveDays || 0,
      truancyHours: att.truancyHours || 0,
      attendanceRate: att.attendanceRate || 100,
    });

    (s.accessCodes || []).forEach(function (c) {
      accessCodeFlat.push({
        id: c.id,
        studentId: s.studentId,
        codeType: c.codeType || 'other',
        label: c.label || '',
        password: c.password || '',
        updatedAt: c.updatedAt || '',
        note: c.note || '',
      });
    });
  });

  writeRows_(SHEET_NAMES.students, studentHeaders, studentFlat);
  writeRows_(SHEET_NAMES.semesters, semesterHeaders, semesterFlat);
  writeRows_(SHEET_NAMES.courses, courseHeaders, courseFlat);
  writeRows_(SHEET_NAMES.discipline, disciplineHeaders, disciplineFlat);
  writeRows_(SHEET_NAMES.attendance, attendanceHeaders, attendanceFlat);
  writeRows_(SHEET_NAMES.accessCodes, accessCodeHeaders, accessCodeFlat);
  writeRows_(SHEET_NAMES.documents, documentHeaders, documents);
  writeRows_(SHEET_NAMES.audit, auditHeaders, auditLogs);

  if (adminAccounts !== null) {
    var adminFlat = adminAccounts
      .map(function (a) {
        var username = String((a && a.username) || '').trim();
        var password = String((a && a.password) || '');
        var role = normalizeAdminRole_(a && a.role);
        var displayName = String((a && a.displayName) || '').trim();
        var enabled =
          a && (a.enabled === false || a.enabled === 'FALSE' || a.enabled === 0)
            ? false
            : true;
        if (!username || !password || !role) return null;
        return {
          username: username,
          password: password,
          role: role,
          displayName: displayName || username,
          enabled: enabled,
        };
      })
      .filter(function (a) {
        return !!a;
      });

    // 若前端送來空陣列，改寫回預設帳號，避免整表被清空導致無法登入
    writeRows_(
      SHEET_NAMES.adminAccounts,
      adminAccountHeaders,
      adminFlat.length > 0 ? adminFlat : DEFAULT_ADMIN_ACCOUNTS
    );
  }
}
