import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { StudentProfile, SemesterRecord } from '../types';
import { generateVerificationCode } from './security';

/**
 * 匯出高解析度正式中英文成績單 PDF
 */
export async function downloadTranscriptPdf(
  elementId: string,
  student: StudentProfile,
  semester: SemesterRecord
): Promise<boolean> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`Element with id ${elementId} not found, falling back to direct PDF.`);
      downloadFallbackPdf(student, semester);
      return true;
    }

    // 使用 html2canvas 捕捉高清晰度畫面 (scale: 2 適用 300DPI 列印等級)
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // 計算縮放比率符合 A4 邊距
    const ratio = Math.min((pdfWidth - 10) / imgWidth, (pdfHeight - 10) / imgHeight);
    const renderWidth = imgWidth * ratio;
    const renderHeight = imgHeight * ratio;
    const marginX = (pdfWidth - renderWidth) / 2;
    const marginY = 8;

    pdf.addImage(imgData, 'JPEG', marginX, marginY, renderWidth, renderHeight);
    
    const fileName = `${student.studentId}_${student.name}_${semester.semesterId}_學業成績單.pdf`;
    pdf.save(fileName);
    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    downloadFallbackPdf(student, semester);
    return false;
  }
}

/**
 * 純程式碼快速 PDF 備援機制
 */
export function downloadFallbackPdf(student: StudentProfile, semester: SemesterRecord): void {
  const doc = new jsPDF();
  const verifyCode = generateVerificationCode(student.studentId, semester.semesterId);

  doc.setFontSize(16);
  doc.text('Kaohsiung Municipal Chung-Cheng Industrial High School', 105, 20, { align: 'center' });
  doc.setFontSize(13);
  doc.text('Official Academic Grade Report / Transcript', 105, 28, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Semester: ${semester.semesterName} (${semester.semesterId})`, 105, 35, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.line(20, 38, 190, 38);

  doc.setFontSize(10);
  doc.text(`Student ID: ${student.studentId}`, 20, 46);
  doc.text(`Name: ${student.nameEn} (${student.name})`, 20, 52);
  doc.text(`Department: ${student.department}`, 20, 58);
  doc.text(`Class Rank: ${semester.classRank} / ${semester.classSize}`, 120, 46);
  doc.text(`Semester GPA: ${semester.semesterGpa.toFixed(2)}`, 120, 52);
  doc.text(`Semester Avg: ${semester.semesterAverage.toFixed(1)}`, 120, 58);

  doc.line(20, 62, 190, 62);

  // Table header
  let y = 70;
  doc.setFontSize(9);
  doc.text('No.', 22, y);
  doc.text('Course Code', 32, y);
  doc.text('Course Title', 62, y);
  doc.text('Credits', 125, y);
  doc.text('Score', 145, y);
  doc.text('Grade', 165, y);
  doc.text('Status', 180, y);

  doc.line(20, y + 2, 190, y + 2);

  y += 7;
  semester.courses.forEach((c, index) => {
    doc.text(String(index + 1), 22, y);
    doc.text(c.courseId, 32, y);
    doc.text(c.courseNameEn || c.courseName, 62, y);
    doc.text(String(c.credits), 128, y);
    doc.text(String(c.score), 148, y);
    doc.text(c.letterGrade, 167, y);
    doc.text(c.passed ? 'PASS' : 'FAIL', 180, y);
    y += 6;
  });

  doc.line(20, y + 2, 190, y + 2);

  y += 12;
  doc.setFontSize(9);
  doc.text(`Total Credits Earned: ${semester.earnedCredits} / ${semester.semesterCredits}`, 20, y);
  doc.text(`Conduct Score: ${semester.conductScore} (${semester.conductGrade})`, 120, y);

  y += 18;
  doc.setFontSize(8);
  doc.text(`Official Verification Code: ${verifyCode}`, 20, y);
  doc.text(`Issued Date: ${new Date().toISOString().split('T')[0]}`, 20, y + 5);
  doc.text('Office of Academic Affairs - Registrar Division. Protected under Personal Data Protection Act.', 20, y + 10);

  doc.save(`${student.studentId}_${semester.semesterId}_Transcript.pdf`);
}
