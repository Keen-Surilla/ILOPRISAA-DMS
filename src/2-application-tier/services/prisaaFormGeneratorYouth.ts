import ExcelJS from 'exceljs';
import { downloadImageAsBuffer, type AthleteExportData } from '../../3-data-tier/api/exportApi';

const TEMPLATE_PATHS = {
  highschool: '/templates/PRISAA-FORM-01A GALLERY OF ATHLETES FOR SECONDARY.xlsx',
  elementary: '/templates/PRISAA-FORM-01A GALLERY OF ATHLETES FOR ELEMENTARY.xlsx',
};

const PHOTO_ROW_START = 9;  // row 10 (0-indexed)
const PHOTO_ROW_SPAN = 12;  // spans through row 21
const PHOTO_COL_SPAN = 11;

const BLOCK_START_COLS = ['L', 'W', 'AH', 'AS', 'BD'];
const CHECK_MARK = '✓';

function colLetterToIndex(letters: string): number {
  let result = 0;
  for (let i = 0; i < letters.length; i++) result = result * 26 + (letters.charCodeAt(i) - 64);
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
  divisionGender: 'BOYS' | 'GIRLS';
}
export interface CoachExportInfo {
  name: string;
  signatureUrl?: string | null;
  photoBuffer?: ArrayBuffer | null;
}

export async function generatePrisaaForm01AYouth(
  athletes: AthleteExportData[],
  headerInfo: FormHeaderInfo,
  coachInfo: CoachExportInfo,
  division: 'highschool' | 'elementary'
): Promise<Blob> {
  if (athletes.length === 0) throw new Error('Select at least one athlete before generating the form.');
  if (athletes.length > 5) throw new Error('A single Form 01A sheet supports a maximum of 5 athletes.');

  const workbook = new ExcelJS.Workbook();
  const templateBuffer = await (await fetch(TEMPLATE_PATHS[division])).arrayBuffer();
  await workbook.xlsx.load(templateBuffer);
  const ws = workbook.getWorksheet('Sheet1');
  if (!ws) throw new Error('Template sheet "Sheet1" not found.');

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // --- Header ---
  ws.getCell('BE2').value = headerInfo.cluster;
  ws.getCell('BE4').value = headerInfo.region;
  ws.getCell('BE6').value = headerInfo.sportsEvent;
  ws.getCell(headerInfo.divisionGender === 'BOYS' ? 'BH8' : 'BM8').value = CHECK_MARK;

  // --- Coach ---
  if (coachInfo.photoBuffer) {
    const imageId = workbook.addImage({ buffer: coachInfo.photoBuffer as any, extension: 'jpeg' });
    ws.addImage(imageId, { tl: { col: 0, row: 12 } as any, ext: { width: 90, height: 100 } });
  }
  ws.getCell('A21').value = coachInfo.name;
  ws.getCell('D22').value = CHECK_MARK;
  ws.getCell('A38').value = coachInfo.name;
  ws.getCell('D41').value = today;

  if (coachInfo.signatureUrl) {
    try {
      const sigResponse = await fetch(coachInfo.signatureUrl);
      const sigBuffer = await sigResponse.arrayBuffer();
      const sigImageId = workbook.addImage({ buffer: sigBuffer as any, extension: 'png' });
      ws.addImage(sigImageId, { tl: { col: 3, row: 36 } as any, ext: { width: 100, height: 30 } });
    } catch (err) {
      console.error('Could not embed coach signature:', err);
    }
  }

  // --- Each athlete block ---
  for (let i = 0; i < athletes.length; i++) {
    const athlete = athletes[i];
    const startCol = BLOCK_START_COLS[i];
    const { lastName, firstName, middleInitial } = athlete.academicData;
    const formattedName = middleInitial ? `${lastName}, ${firstName} ${middleInitial}.` : `${lastName}, ${firstName}`;

    ws.getCell(`${offsetCol(startCol, 0)}22`).value = formattedName;
    ws.getCell(`${offsetCol(startCol, 0)}24`).value = athlete.dateOfBirth ?? '';
    ws.getCell(`${offsetCol(startCol, 0)}25`).value = athlete.age ?? '';
    ws.getCell(`${offsetCol(startCol, 0)}26`).value = athlete.academicData.yearLevel;
    ws.getCell(`${offsetCol(startCol, 0)}27`).value = athlete.academicData.schoolPresentlyEnrolled;

    ws.getCell(`${offsetCol(startCol, 3)}28`).value = CHECK_MARK; // SF10
    ws.getCell(`${offsetCol(startCol, 3)}29`).value = CHECK_MARK; // PC
    ws.getCell(`${offsetCol(startCol, 3)}30`).value = CHECK_MARK; // MC
    ws.getCell(`${offsetCol(startCol, 9)}28`).value = CHECK_MARK; // Data Privacy
    ws.getCell(`${offsetCol(startCol, 9)}29`).value = CHECK_MARK; // Copy of PSA
    ws.getCell(`${offsetCol(startCol, 9)}30`).value = CHECK_MARK; // PIC

    ws.getCell(`${offsetCol(startCol, 0)}31`).value = CHECK_MARK; // Qualified

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