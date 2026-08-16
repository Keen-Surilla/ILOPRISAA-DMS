import ExcelJS from 'exceljs';
import { downloadImageAsBuffer, type AthleteExportData } from '../../3-data-tier/api/exportApi';

const TEMPLATE_PATH = '/templates/PRISAA-FORM-01B.xlsx';
const BLOCK_START_COLS = ['L', 'W', 'AH', 'AS', 'BD'];
const CHECK_MARK = '✓';

const PASS_THRESHOLD = 60;
const FAIL_THRESHOLD = 40;

function getAcademicEligibility(semester: { enrolled: number; passed: number; failed: number; percentage: number }) {
  const isComplete = semester.enrolled > 0 && semester.passed >= 0 && (semester.passed > 0 || semester.failed > 0);
  if (!isComplete) return { eligible: true, reason: null };

  if (semester.percentage < PASS_THRESHOLD) {
    return { eligible: false, reason: `Below ${PASS_THRESHOLD}% passing rate` };
  }
  const failRate = (semester.failed / semester.enrolled) * 100;
  if (failRate >= FAIL_THRESHOLD) {
    return { eligible: false, reason: `${Math.round(failRate)}% failure rate exceeds ${FAIL_THRESHOLD}% limit` };
  }
  return { eligible: true, reason: null };
}

function colLetterToIndex(letters: string): number {
  let result = 0;
  for (let i = 0; i < letters.length; i++) {
    result = result * 26 + (letters.charCodeAt(i) - 64);
  }
  return result;
}

function colIndexToLetter(index: number): string {
  let letters = '';
  while (index > 0) {
    const rem = (index - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    index = Math.floor((index - 1) / 26);
  }
  return letters;
}

function offsetCol(startCol: string, offset: number): string {
  return colIndexToLetter(colLetterToIndex(startCol) + offset);
}

export interface FormHeaderInfo {
  cluster: string;
  region: string;
  sportsEvent: string;
  divisionGender: 'MEN' | 'WOMEN';
}

export interface CoachExportInfo {
  name: string;
  signatureUrl?: string | null;
  photoBuffer?: ArrayBuffer | null;
}

export async function generatePrisaaForm01B(
  athletes: AthleteExportData[],
  headerInfo: FormHeaderInfo,
  coachInfo: CoachExportInfo
): Promise<Blob> {
  if (athletes.length === 0) {
    throw new Error('Select at least one athlete before generating the form.');
  }
  if (athletes.length > 5) {
    throw new Error('A single Form 01B sheet supports a maximum of 5 athletes.');
  }

  const workbook = new ExcelJS.Workbook();
  const templateBuffer = await (await fetch(TEMPLATE_PATH)).arrayBuffer();
  await workbook.xlsx.load(templateBuffer);
  const ws = workbook.getWorksheet('Sheet1');
  if (!ws) throw new Error('Template sheet "Sheet1" not found.');

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });


  // --- Header ---
  ws.getCell('BE2').value = headerInfo.cluster;
  ws.getCell('BE4').value = headerInfo.region;
  ws.getCell('BE6').value = headerInfo.sportsEvent;
  ws.getCell(headerInfo.divisionGender === 'MEN' ? 'BH8' : 'BM8').value = CHECK_MARK;

  // --- Coach: photo, name, signature, date — written ONCE, outside the athlete loop ---
  if (coachInfo.photoBuffer) {
    const imageId = workbook.addImage({ buffer: coachInfo.photoBuffer as any, extension: 'jpeg' });
    ws.addImage(imageId, { tl: { col: 0, row: 12 } as any, ext: { width: 90, height: 100 } });
  }

  ws.getCell('A21').value = coachInfo.name;
  ws.getCell('D22').value = CHECK_MARK;
  ws.getCell('A43').value = coachInfo.name;
  ws.getCell('D46').value = today;

  if (coachInfo.signatureUrl) {
    try {
      const sigResponse = await fetch(coachInfo.signatureUrl);
      const sigBuffer = await sigResponse.arrayBuffer();
      const sigImageId = workbook.addImage({ buffer: sigBuffer as any, extension: 'png' });
      ws.addImage(sigImageId, { tl: { col: 3, row: 41 } as any, ext: { width: 100, height: 30 } });
    } catch (err) {
      console.error('Could not embed coach signature:', err);
    }
  }

  // --- Each athlete block ---
  for (let i = 0; i < athletes.length; i++) {
    const athlete = athletes[i];
    const startCol = BLOCK_START_COLS[i];
    const { academicLoad, lastName, firstName, middleInitial } = athlete.academicData;

    const formattedName = middleInitial
      ? `${lastName}, ${firstName} ${middleInitial}.`
      : `${lastName}, ${firstName}`;

    ws.getCell(`${offsetCol(startCol, 0)}22`).value = formattedName;
    ws.getCell(`${offsetCol(startCol, 0)}24`).value = athlete.dateOfBirth ?? '';
    ws.getCell(`${offsetCol(startCol, 7)}24`).value = athlete.age ?? '';
    ws.getCell(`${offsetCol(startCol, 0)}25`).value = athlete.academicData.yearGraduatedFromSHS;
    ws.getCell(`${offsetCol(startCol, 0)}26`).value = athlete.academicData.yearLevel;
    ws.getCell(`${offsetCol(startCol, 5)}26`).value = athlete.academicData.course;
    ws.getCell(`${offsetCol(startCol, 0)}27`).value = athlete.academicData.schoolPresentlyEnrolled;

    ws.getCell(`${offsetCol(startCol, 5)}28`).value = academicLoad.firstSemester.enrolled;
    ws.getCell(`${offsetCol(startCol, 5)}29`).value = academicLoad.firstSemester.passed;
    ws.getCell(`${offsetCol(startCol, 5)}30`).value = academicLoad.firstSemester.failed;
    ws.getCell(`${offsetCol(startCol, 5)}31`).value = academicLoad.firstSemester.percentage;
    ws.getCell(`${offsetCol(startCol, 5)}32`).value = academicLoad.secondSemester.enrolled;

    ws.getCell(`${offsetCol(startCol, 3)}33`).value = CHECK_MARK;
    ws.getCell(`${offsetCol(startCol, 3)}34`).value = CHECK_MARK;
    ws.getCell(`${offsetCol(startCol, 3)}35`).value = CHECK_MARK;
    ws.getCell(`${offsetCol(startCol, 9)}33`).value = CHECK_MARK;
    ws.getCell(`${offsetCol(startCol, 9)}34`).value = CHECK_MARK;
    ws.getCell(`${offsetCol(startCol, 9)}35`).value = CHECK_MARK;

    const firstSemEligible = getAcademicEligibility(academicLoad.firstSemester).eligible;
const secondSemEligible = getAcademicEligibility(academicLoad.secondSemester).eligible;
const isAcademicallyQualified = firstSemEligible && secondSemEligible;

if (isAcademicallyQualified) {
  ws.getCell(`${offsetCol(startCol, 0)}36`).value = CHECK_MARK; // Qualified
} else {
  ws.getCell(`${offsetCol(startCol, 0)}38`).value = CHECK_MARK; // Disqualified
  ws.getCell(`${offsetCol(startCol, 0)}40`).value = 'Below 60% passing rate or exceeds 40% failure rate'; // Reason
}

    const PHOTO_ROW_START = 9;
    const PHOTO_ROW_SPAN = 12;
    const PHOTO_COL_SPAN = 11;

    if (athlete.photoStoragePath) {
      const photoBuffer = await downloadImageAsBuffer(athlete.photoStoragePath);
      if (photoBuffer) {
        const imageId = workbook.addImage({ buffer: photoBuffer as any, extension: 'jpeg' });
        const colIndex = colLetterToIndex(startCol) - 1;
        ws.addImage(imageId, {
          tl: { col: colIndex, row: PHOTO_ROW_START } as any,
          br: { col: colIndex + PHOTO_COL_SPAN, row: PHOTO_ROW_START + PHOTO_ROW_SPAN } as any,
          editAs: 'oneCell',
        });
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}