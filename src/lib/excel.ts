import ExcelJS from 'exceljs';
import type { Paper } from '../types';

const BORDER = {
  top: { style: 'thin' as const, color: { argb: 'FFC0C0C0' } },
  left: { style: 'thin' as const, color: { argb: 'FFC0C0C0' } },
  bottom: { style: 'thin' as const, color: { argb: 'FFC0C0C0' } },
  right: { style: 'thin' as const, color: { argb: 'FFC0C0C0' } },
};

function writeSheet(sheet: ExcelJS.Worksheet, paper: Paper, withAnswers: boolean): void {
  const { rule } = paper;
  sheet.views = [{ showGridLines: false }];
  sheet.columns = [
    { width: 9 },
    ...Array.from({ length: 25 }, () => ({ width: 9 })),
  ];

  const title = (row: number, col: number, value: string, bold = false, size = 10) => {
    const cell = sheet.getCell(row, col);
    cell.value = value;
    cell.font = { name: 'Calibri', size, bold };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  };

  title(1, 1, 'ABACUS', true, 14);
  sheet.mergeCells('D1:H1');
  title(1, 4, `GRADE - ${paper.grade}`, true, 12);
  sheet.getCell(1, 4).alignment = { horizontal: 'center' };
  sheet.mergeCells('J1:N1');
  title(1, 10, `${rule.headerTitle} -${paper.modelNo}`, true, 12);
  sheet.getCell(1, 10).alignment = { horizontal: 'center' };
  sheet.mergeCells('T1:Z1');
  title(1, 20, 'GROUP   A1   A2   A3', true, 10);
  sheet.getCell(1, 20).alignment = { horizontal: 'right' };

  title(2, 1, `Marks per question : ${rule.marksPerQuestion}`);
  sheet.mergeCells('D2:H2');
  title(2, 4, `Time Limit : ${rule.timeMinutes} Minutes`);
  sheet.getCell(2, 4).alignment = { horizontal: 'center' };
  sheet.mergeCells('T2:Z2');
  title(2, 20, `TOTAL MARKS  ${rule.totalMarks}`, true, 10);
  sheet.getCell(2, 20).alignment = { horizontal: 'right' };

  sheet.getRow(1).height = 22;
  sheet.getRow(2).height = 18;
  sheet.getRow(5).height = 8;

  let currentRow = 6;

  for (const section of paper.sections) {
    // Section heading.
    sheet.mergeCells(currentRow, 1, currentRow, 26);
    const heading = sheet.getCell(currentRow, 1);
    const label =
      section.rule.type === 'addsub'
        ? `ADDITION & SUBTRACTION — ${section.rule.caption ?? ''}`
        : section.rule.type === 'multiplication'
          ? `MULTIPLICATION — ${section.rule.caption ?? ''}${section.rule.timeMinutes ? `  (Time: ${section.rule.timeMinutes} min)` : ''}`
          : `DIVISION — ${section.rule.caption ?? ''}${section.rule.timeMinutes ? `  (Time: ${section.rule.timeMinutes} min)` : ''}`;
    heading.value = label;
    heading.font = { bold: true, size: 10, color: { argb: 'FF283C5A' } };
    heading.alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.getRow(currentRow).height = 20;
    currentRow += 1;

    const rows = section.rule.type === 'addsub' ? (section.rule.rows ?? 3) : 2;

    for (let i = 0; i < section.questions.length; i += 25) {
      const chunk = section.questions.slice(i, i + 25);
      const headerRow = currentRow;

      const noCell = sheet.getCell(headerRow, 1);
      noCell.value = 'No.';
      noCell.font = { bold: true, size: 9 };
      noCell.alignment = { horizontal: 'center', vertical: 'middle' };
      noCell.border = BORDER;
      sheet.getRow(headerRow).height = 18;

      for (let col = 0; col < 25; col += 1) {
        const question = chunk[col];
        const cell = sheet.getCell(headerRow, col + 2);
        cell.value = question ? i + col + 1 : '';
        cell.font = { bold: true, size: 9 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = BORDER;
      }

      for (let lineIndex = 0; lineIndex < rows; lineIndex += 1) {
        const row = headerRow + 1 + lineIndex;
        sheet.getRow(row).height = section.rule.type === 'addsub' && rows >= 7 ? 12 : 15;
        sheet.getCell(row, 1).border = BORDER;

        for (let col = 0; col < 25; col += 1) {
          const question = chunk[col];
          const operand = question?.lines[lineIndex];
          const cell = sheet.getCell(row, col + 2);
          cell.value = operand ? `${operand.op ? `${operand.op} ` : ''}${operand.value}` : '';
          cell.font = { size: 9, name: 'Consolas' };
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.border = BORDER;
        }
      }

      const answerRow = headerRow + 1 + rows;
      sheet.getRow(answerRow).height = 18;
      const ansLabel = sheet.getCell(answerRow, 1);
      ansLabel.value = 'Ans';
      ansLabel.font = { bold: true, size: 9 };
      ansLabel.alignment = { horizontal: 'center', vertical: 'middle' };
      ansLabel.border = BORDER;

      for (let col = 0; col < 25; col += 1) {
        const question = chunk[col];
        const cell = sheet.getCell(answerRow, col + 2);
        cell.value = withAnswers && question ? question.answer : '';
        cell.font = { bold: withAnswers, size: 9 };
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF606060' } },
          left: BORDER.left,
          right: BORDER.right,
          bottom: BORDER.bottom,
        };
      }

      currentRow = answerRow + 2;
    }
  }

  sheet.pageSetup = {
    orientation: 'landscape',
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.25,
      right: 0.25,
      top: 0.3,
      bottom: 0.3,
      header: 0.1,
      footer: 0.1,
    },
  };
}

export async function paperToExcelBlob(paper: Paper, withAnswers: boolean): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Abacus Question Paper Maker';
  writeSheet(workbook.addWorksheet('Question Paper'), paper, false);
  writeSheet(workbook.addWorksheet('Answer Key'), paper, true);
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
