import ExcelJS from 'exceljs';
import type { AthleteExportData } from '../../3-data-tier/api/exportApi';

const TEMPLATE_PATH = '/public/templates/PRISAA-FORM-01B GALLERY OF ATHLETES FOR SENIOR DIVISION.xlsx'; // TODO: confirm this is the correct template for tertiary, or point to a separate one
const BLOCK_START_COLS = ['L', 'W', 'AH', 'AS', 'BD'];
const CHECK_MARK = '✓';

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

// Tertiary: no signatureUrl — coach signature is not part of this variant
export interface CoachExportInfoTertiary {
  name: string;
  photoBuffer?: ArrayBuffer | null;
}

export async function generatePrisaaForm01BTertiary(
  athletes: AthleteExportData[],
  headerInfo: FormHeaderInfo,
  coachInfo: CoachExportInfoTertiary
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

  // --- Header ---
  ws.getCell('BE2').value = headerInfo.cluster;
  ws.getCell('BE4').value = headerInfo.region;
  ws.getCell('BE6').value = headerInfo.sportsEvent;
  ws.getCell(headerInfo.divisionGender === 'MEN' ? 'BH8' : 'BM8').value = CHECK_MARK;

  // --- Coach: photo + name only — no signature for tertiary ---
  if (coachInfo.photoBuffer) {
    const imageId = workbook.addImage({ buffer: coachInfo.photoBuffer as any, extension: 'jpeg' });
    ws.addImage(imageId, { tl: { col: 0, row: 12 } as any, ext: { width: 90, height: 100 } });
  }

  ws.getCell('A21').value = coachInfo.name;
  ws.getCell('D22').value = CHECK_MARK;
  ws.getCell('A43').value = coachInfo.name;

  // --- Each athlete block ---
  for (let i = 0; i < athletes.length; i++) {
    const athlete = athletes[i];
    const startCol = BLOCK_START_COLS[i];
    const { lastName, firstName, middleInitial } = athlete.academicData;

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

    // Removed for tertiary:
    // - academic load / units (enrolled, passed, failed, percentage) — rows 28-32
    // - TOR / PC / MC document checkmarks — rows 33-35
    // - Qualified / Disqualified eligibility checklist — rows 36-40
    // - 2x2 athlete photo embed
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}