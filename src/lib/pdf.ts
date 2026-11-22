import { jsPDF } from 'jspdf';
import type { Paper } from '../types';
import { buildBlocks, operandFontPx, sectionCaption } from './blocks';
import {
  BLOCK_BOTTOM_LINES,
  BLOCK_FIRST_LINES,
  VERTICAL_LINES,
  blockGeometry,
  fontPt,
  pxX,
  pxY,
} from './template';

const PAGE_W = 841.89;
const PAGE_H = 595.28;

function line(doc: jsPDF, x1: number, y1: number, x2: number, y2: number, width: number): void {
  doc.setLineWidth(width);
  doc.line(x1, y1, x2, y2);
}

function text(
  doc: jsPDF,
  value: string,
  px: number,
  py: number,
  options: {
    size?: number;
    bold?: boolean;
    align?: 'left' | 'center' | 'right';
    color?: [number, number, number];
  } = {},
): void {
  doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
  doc.setFontSize(options.size ?? 8);
  doc.setTextColor(...(options.color ?? [0, 0, 0]));
  doc.text(value, pxX(px), pxY(py), { align: options.align ?? 'left' });
}

function drawHeader(doc: jsPDF, paper: Paper, answerKey: boolean): void {
  const { grade, modelNo, rule } = paper;

  text(doc, 'COMPULSORY', 31, 26, { size: 8, bold: true });
  text(doc, 'ABACUS', 45, 30, { size: 12, bold: true });
  text(doc, 'Marks per question', 24, 84, { size: 8 });

  text(doc, `GRADE - ${grade}`, 390, 26, { size: 13, bold: true, align: 'center' });
  text(doc, `${rule.headerTitle} -${modelNo}`, 390, 61, { size: 10, bold: true, align: 'center' });
  text(doc, `Time Limit : ${rule.timeMinutes} Minutes    (100 Q)`, 390, 84, {
    size: 8,
    align: 'center',
  });

  text(doc, 'GROUP', 660, 30, { size: 9, bold: true });
  text(doc, 'A1   A2   A3', 660, 62, { size: 9, bold: true });
  text(doc, 'TOTAL', 745, 30, { size: 9, bold: true });
  text(doc, 'MARKS', 745, 50, { size: 9, bold: true });
  text(doc, String(rule.totalMarks), 835, 61, { size: 10, bold: true });
  text(doc, 'Paper Corrector Sign', 890, 21, { size: 8 });
  text(doc, 'Data Entry Sign', 890, 61, { size: 8 });

  if (answerKey) {
    text(doc, 'ANSWER KEY', 150, 40, { size: 9, bold: true, color: [180, 20, 20] });
  }
}

function drawGrid(doc: jsPDF, paper: Paper, answerKey: boolean): void {
  const blocks = buildBlocks(paper);
  const gridTop = pxY(BLOCK_FIRST_LINES[0]);
  const gridBottom = pxY(BLOCK_BOTTOM_LINES[3]);
  const leftRule = pxX(VERTICAL_LINES[0]);
  const rightRule = pxX(VERTICAL_LINES[26]);

  // Vertical rules span the whole grid.
  doc.setDrawColor(70, 70, 70);
  line(doc, pxX(VERTICAL_LINES[0]), gridTop, pxX(VERTICAL_LINES[0]), gridBottom, 0.7);
  line(doc, pxX(VERTICAL_LINES[1]), gridTop, pxX(VERTICAL_LINES[1]), gridBottom, 0.7);
  line(doc, pxX(VERTICAL_LINES[26]), gridTop, pxX(VERTICAL_LINES[26]), gridBottom, 0.7);
  doc.setDrawColor(165, 165, 165);
  for (let index = 2; index < 26; index += 1) {
    line(doc, pxX(VERTICAL_LINES[index]), gridTop, pxX(VERTICAL_LINES[index]), gridBottom, 0.3);
  }

  blocks.forEach((block, band) => {
    const isMulDiv = block.section.type !== 'addsub';
    const rows = isMulDiv ? 2 : (block.section.rows ?? 3);
    const fontPx = operandFontPx(rows, isMulDiv);
    const geometry = blockGeometry(band, rows, fontPx);

    // Section caption sits in the gap above the block when a new section starts.
    if (block.isSectionStart) {
      text(doc, sectionCaption(block.section), 24, geometry.firstLine - 12, {
        size: fontPt(9),
        bold: true,
        color: [40, 60, 90],
      });
    }

    // Horizontal rules.
    doc.setDrawColor(70, 70, 70);
    line(doc, leftRule, pxY(geometry.firstLine), rightRule, pxY(geometry.firstLine), 0.6);
    geometry.operandLines.forEach((y, index) => {
      const isLast = index === geometry.operandLines.length - 1;
      doc.setDrawColor(isLast ? 80 : 175, isLast ? 80 : 175, isLast ? 80 : 175);
      line(doc, leftRule, pxY(y), rightRule, pxY(y), isLast ? 0.6 : 0.3);
    });
    line(doc, leftRule, pxY(geometry.bottom), rightRule, pxY(geometry.bottom), 0.7);

    text(doc, 'No.', 21, geometry.numberBaseline, { size: fontPt(9), bold: true });
    text(doc, 'Ans', 18, geometry.answerBaseline, { size: fontPt(9), bold: true });

    const fontSize = fontPt(fontPx);

    block.questions.forEach((question, col) => {
      const center = (VERTICAL_LINES[col + 1] + VERTICAL_LINES[col + 2]) / 2;
      const rightEdge = VERTICAL_LINES[col + 2] - 2;
      const number = block.startNumber + col;

      text(doc, String(number), center, geometry.numberBaseline, {
        size: fontPt(9),
        bold: true,
        align: 'center',
      });

      question.lines.forEach((operand, row) => {
        const baseline = geometry.operandBaselines[row];
        if (baseline === undefined) return;
        const value = operand.op ? `${operand.op} ${operand.value}` : `${operand.value}`;
        text(doc, value, rightEdge, baseline, { size: fontSize, align: 'right' });
      });

      if (answerKey) {
        text(doc, String(question.answer), rightEdge, geometry.answerBaseline, {
          size: fontPt(9),
          bold: true,
          align: 'right',
        });
      }
    });
  });
}

export function paperToPdfBlob(paper: Paper, answerKey: boolean): Blob {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
    compress: true,
  });
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  drawHeader(doc, paper, answerKey);
  drawGrid(doc, paper, answerKey);
  return doc.output('blob');
}
