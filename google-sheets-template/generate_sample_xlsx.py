# -*- coding: utf-8 -*-
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from pathlib import Path

wb = Workbook()

header_fill = PatternFill("solid", fgColor="1E3A8A")
header_font = Font(color="FFFFFF", bold=True)
thin = Border(
    left=Side(style="thin", color="CBD5E1"),
    right=Side(style="thin", color="CBD5E1"),
    top=Side(style="thin", color="CBD5E1"),
    bottom=Side(style="thin", color="CBD5E1"),
)


def style_header(ws, headers):
    ws.append(headers)
    for cell in ws[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", wrap_text=True)
        cell.border = thin
    ws.freeze_panes = "A2"


def autosize(ws):
    for col in ws.columns:
        max_len = 0
        letter = col[0].column_letter
        for cell in col:
            val = "" if cell.value is None else str(cell.value)
            max_len = max(max_len, min(len(val), 40))
        ws.column_dimensions[letter].width = max(12, max_len + 2)


ws = wb.active
ws.title = "使用說明"
ws["A1"] = "高雄市立中正高工 · Google 試算表範例"
ws["A1"].font = Font(size=16, bold=True, color="1E3A8A")
lines = [
    "",
    "這個檔案可直接上傳到 Google 試算表使用。",
    "",
    "【匯入 Google 試算表】",
    "1. 開啟 https://sheets.google.com → 新增試算表",
    "2. 檔案 → 匯入 → 上傳 → 選擇本 Excel 檔",
    "3. 匯入位置選「取代試算表」",
    "",
    "【接上系統 API】",
    "1. 在試算表：擴充功能 → Apps Script",
    "2. 貼上專案內 google-apps-script/Code.gs 全部內容並儲存",
    "3. 部署 → 新部署 → 網頁應用程式（執行身分：我／存取權：任何人）",
    "4. 複製網址到 VITE_SHEETS_API_URL",
    "",
    "【測試登入】",
    "S1121001 / A123456789（王小明）",
    "S1121002 / B220145675（陳美華）",
    "S1112003 / C123456781（林俊傑）",
    "",
    "注意：此為 Demo 假資料，請勿放入真實個資。",
]
for i, line in enumerate(lines, start=2):
    ws[f"A{i}"] = line
ws.column_dimensions["A"].width = 80

students_headers = [
    "studentId",
    "nationalId",
    "name",
    "nameEn",
    "gender",
    "birthDate",
    "college",
    "department",
    "gradeLevel",
    "className",
    "advisor",
    "enrollmentStatus",
    "enrollmentDate",
    "email",
    "phone",
    "emergencyName",
    "emergencyRelationship",
    "emergencyPhone",
    "mailingAddress",
    "permanentAddress",
    "avatarUrl",
    "isProfileConfirmed",
    "confirmedAt",
    "confirmedSignature",
    "totalCreditsEarned",
    "graduationRequiredCredits",
    "cumulativeGpa",
    "cumulativeAverage",
]
ws = wb.create_sheet("學籍")
style_header(ws, students_headers)
for row in [
    [
        "S1121001",
        "A123456789",
        "王小明",
        "Wang, Xiao-Ming",
        "男",
        "2004-05-18",
        "資訊與工程學院",
        "資訊工程學系",
        3,
        "資工三甲",
        "張慶隆 教授",
        "在學",
        "2023-09-01",
        "s1121001@student.ccvs.kh.edu.tw",
        "0912-345-678",
        "王大同 (父)",
        "父子",
        "0922-888-999",
        "臺北市大安區新生南路二段88巷12號4樓",
        "新北市板橋區縣民大道二段66號",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        True,
        "2026-09-12 14:32:00",
        "王小明 (數位簽章流水驗證)",
        76,
        128,
        3.82,
        88.6,
    ],
    [
        "S1121002",
        "B220145675",
        "陳美華",
        "Chen, Mei-Hua",
        "女",
        "2005-02-14",
        "管理學院",
        "財務金融學系",
        3,
        "財金三乙",
        "林美蘭 教授",
        "在學",
        "2023-09-01",
        "s1121002@student.ccvs.kh.edu.tw",
        "0933-222-111",
        "陳國華 (父)",
        "父女",
        "0910-555-777",
        "臺中市西屯區臺灣大道三段99號10樓",
        "彰化縣員林市中山路二段100號",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
        False,
        "",
        "",
        74,
        128,
        3.91,
        90.4,
    ],
    [
        "S1112003",
        "C123456781",
        "林俊傑",
        "Lin, Chun-Chieh",
        "男",
        "2003-11-20",
        "工學院",
        "機械工程學系",
        4,
        "機械四丙",
        "沈啟明 教授",
        "在學",
        "2022-09-01",
        "s1112003@student.ccvs.kh.edu.tw",
        "0955-666-888",
        "林媽媽 (母)",
        "母子",
        "0933-777-666",
        "高雄市左營區博愛二路333號",
        "高雄市鳳山區五甲路12號",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        True,
        "2026-10-01 11:20:00",
        "林俊傑 (已確認學籍)",
        118,
        132,
        3.65,
        84.8,
    ],
]:
    ws.append(row)
autosize(ws)

ws = wb.create_sheet("學期彙總")
style_header(
    ws,
    [
        "studentId",
        "semesterId",
        "semesterName",
        "academicYear",
        "semesterTerm",
        "semesterCredits",
        "earnedCredits",
        "semesterAverage",
        "semesterGpa",
        "classRank",
        "classSize",
        "departmentRank",
        "departmentSize",
        "conductScore",
        "conductGrade",
    ],
)
for row in [
    ["S1121001", "113-1", "113學年度第1學期", "113", "上學期", 20, 20, 91.2, 4.0, 2, 48, 5, 112, 92, "優等"],
    ["S1121001", "112-2", "112學年度第2學期", "112", "下學期", 22, 22, 88.5, 3.85, 4, 48, 9, 112, 90, "優等"],
    ["S1121001", "112-1", "112學年度第1學期", "112", "上學期", 21, 21, 86.4, 3.62, 7, 48, 16, 112, 88, "甲等"],
    ["S1121002", "113-1", "113學年度第1學期", "113", "上學期", 19, 19, 92.5, 4.15, 1, 45, 2, 95, 95, "優等"],
    ["S1112003", "113-1", "113學年度第1學期", "113", "上學期", 16, 16, 86.0, 3.75, 8, 42, 18, 120, 89, "甲等"],
]:
    ws.append(row)
autosize(ws)

ws = wb.create_sheet("成績科目")
style_header(
    ws,
    [
        "studentId",
        "semesterId",
        "courseId",
        "courseName",
        "courseNameEn",
        "credits",
        "category",
        "score",
        "letterGrade",
        "gp",
        "passed",
        "instructor",
    ],
)
for row in [
    ["S1121001", "113-1", "CS301", "作業系統概論", "Operating Systems", 3, "必修", 94, "A+", 4.3, True, "李秉憲 副教授"],
    ["S1121001", "113-1", "CS304", "演算法分析", "Algorithm Analysis", 3, "必修", 89, "A", 4.0, True, "黃俊傑 教授"],
    ["S1121001", "113-1", "CS315", "資訊安全導論", "Introduction to Information Security", 3, "選修", 96, "A+", 4.3, True, "陳思妤 助理教授"],
    ["S1121001", "113-1", "CS320", "人工智慧與機器學習", "AI & Machine Learning", 3, "選修", 90, "A", 4.0, True, "張慶隆 教授"],
    ["S1121001", "113-1", "CS309", "軟體工程與專案實作", "Software Engineering", 3, "必修", 88, "A-", 3.7, True, "林志豪 助理教授"],
    ["S1121001", "113-1", "GE108", "科技倫理與法律規範", "Tech Ethics and Cyber Law", 2, "通識", 92, "A+", 4.3, True, "楊政憲 講師"],
    ["S1121001", "113-1", "PE301", "健康體能與羽球", "Badminton and Physical Fitness", 1, "必修", 86, "A-", 3.7, True, "鄭大為 講師"],
    ["S1121001", "113-1", "CS399", "專題研究(一)", "Senior Project (I)", 2, "必修", 92, "A+", 4.3, True, "張慶隆 教授"],
    ["S1121002", "113-1", "FIN301", "投資學", "Investments", 3, "必修", 95, "A+", 4.3, True, "林美蘭 教授"],
    ["S1121002", "113-1", "FIN305", "衍生性金融商品", "Financial Derivatives", 3, "必修", 91, "A+", 4.3, True, "郭啟榮 副教授"],
    ["S1112003", "113-1", "ME401", "熱力學與熱傳學實務", "Thermodynamics", 3, "必修", 85, "A", 4.0, True, "沈啟明 教授"],
    ["S1112003", "113-1", "ME402", "機械人自動化控制", "Robotics and Control", 3, "必修", 88, "A-", 3.7, True, "吳勝宏 教授"],
]:
    ws.append(row)
autosize(ws)

ws = wb.create_sheet("獎懲")
style_header(ws, ["id", "studentId", "date", "type", "category", "reason", "approvalOffice", "status"])
for row in [
    ["D101", "S1121001", "2026-10-15", "獎勵", "小功", "代表學校參加教育部全國大專資訊安全攻防競賽 (CTF) 榮獲全國第一名", "學務處", "生效"],
    ["D102", "S1121001", "2026-05-20", "獎勵", "嘉獎", "擔任資工系學會學術股長，熱心籌辦開源程式研討會表現優良", "學務處", "生效"],
    ["D201", "S1121002", "2026-09-28", "獎勵", "嘉獎", "榮獲大專盃校園證券投資模擬競賽特優獎項", "學務處", "生效"],
    ["D301", "S1112003", "2026-03-12", "獎勵", "嘉獎", "協助工學院實驗室儀器校正與安全檢測，熱心盡責", "學務處", "生效"],
]:
    ws.append(row)
autosize(ws)

ws = wb.create_sheet("出缺勤")
style_header(ws, ["studentId", "leaveDays", "sickLeaveDays", "officialLeaveDays", "truancyHours", "attendanceRate"])
for row in [
    ["S1121001", 2, 1, 3, 0, 98.6],
    ["S1121002", 0, 1, 2, 0, 99.2],
    ["S1112003", 1, 2, 1, 0, 97.8],
]:
    ws.append(row)
autosize(ws)

ws = wb.create_sheet("文件審核")
style_header(
    ws,
    ["id", "studentId", "fileName", "fileSize", "category", "uploadTime", "status", "filePreviewUrl", "reviewNotes"],
)
for row in [
    [
        "DOC-001",
        "S1121001",
        "王小明_學生證大頭照_白底二吋.jpg",
        "1.2 MB",
        "學生證相片",
        "2026-09-05 10:30",
        "已核可",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        "相片規格符合教育部數位學生證標準規格",
    ],
    [
        "DOC-002",
        "S1121001",
        "身分證正面彩色影本_個資核對用.pdf",
        "2.4 MB",
        "身分證正面",
        "2026-09-08 16:15",
        "已核可",
        "",
        "查驗無誤，身分已認證",
    ],
    [
        "DOC-003",
        "S1121002",
        "陳美華_多益英語測驗成績920分證明.pdf",
        "3.1 MB",
        "英語檢定證書",
        "2026-10-18 11:05",
        "待審核",
        "",
        "教務處審核中 (符合外語畢業免修門檻)",
    ],
]:
    ws.append(row)
autosize(ws)

ws = wb.create_sheet("通行碼")
style_header(ws, ["id", "studentId", "codeType", "label", "password", "updatedAt", "note"])
for row in [
    ["AC-S1121001-MOCK1", "S1121001", "mock_exam", "113學年度第1次模擬考", "MOCK-8812", "2026-11-01 09:00:00", "由教務處核發"],
    ["AC-S1121001-ENG", "S1121001", "english_test", "校內英語能力檢測報名碼", "ENG-3391", "2026-10-20 14:00:00", ""],
    ["AC-S1121002-MOCK1", "S1121002", "mock_exam", "113學年度第1次模擬考", "MOCK-5520", "2026-11-01 09:00:00", ""],
    ["AC-S1112003-MOCK1", "S1112003", "mock_exam", "113學年度第1次模擬考", "MOCK-7741", "2026-11-01 09:00:00", ""],
]:
    ws.append(row)
autosize(ws)

ws = wb.create_sheet("稽核日誌")
style_header(
    ws,
    [
        "id",
        "timestamp",
        "operatorRole",
        "operatorName",
        "targetStudentId",
        "targetStudentName",
        "action",
        "ipAddress",
        "deviceInfo",
        "securityLevel",
        "details",
    ],
)
for row in [
    [
        "LOG-INIT-001",
        "2026-11-08 09:15:22",
        "academic_affairs",
        "張秘書 (教務處註冊組)",
        "S1121001",
        "王小明",
        "教務處成績修改",
        "140.112.1.15 (教務處行政專網)",
        "桌面端瀏覽器 (Chrome 128 / Windows 11)",
        "關鍵變更",
        "核定並發布 113-1 學期資工系演算法分析成績結算",
    ],
    [
        "LOG-INIT-002",
        "2026-11-08 10:20:05",
        "student_affairs",
        "李組長 (學務處生輔組)",
        "S1121001",
        "王小明",
        "學務處查閱操行",
        "140.112.3.42 (學務處辦公室)",
        "桌面端瀏覽器 (Edge 126 / MacOS)",
        "常規",
        "審核 CTF 資安競賽獎勵小功提報案",
    ],
]:
    ws.append(row)
autosize(ws)

out_dir = Path(__file__).resolve().parent
path = out_dir / "校務學生資料庫_範例.xlsx"
wb.save(path)
print(f"saved: {path}")
print("sheets:", wb.sheetnames)
