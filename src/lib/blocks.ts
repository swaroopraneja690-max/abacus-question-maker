import type { Paper, Question, SectionRule } from '../types';

export interface Block {
  section: SectionRule;
  questions: Question[];
  startNumber: number;
  isSectionStart: boolean;
}

/** Splits a paper's sections into four blocks of 25 questions each. */
export function buildBlocks(paper: Paper): Block[] {
  const blocks: Block[] = [];
  let startNumber = 1;

  for (const section of paper.sections) {
    let isFirstChunk = true;
    for (let i = 0; i < section.questions.length; i += 25) {
      if (blocks.length >= 4) break;
      blocks.push({
        section: section.rule,
        questions: section.questions.slice(i, i + 25),
        startNumber,
        isSectionStart: isFirstChunk,
      });
      startNumber += Math.min(25, section.questions.length - i);
      isFirstChunk = false;
    }
  }
  return blocks;
}

export function sectionCaption(section: SectionRule): string {
  switch (section.type) {
    case 'multiplication':
      return `MULTIPLICATION  —  ${section.caption ?? ''}${section.timeMinutes ? `  (Time: ${section.timeMinutes} min)` : ''}`;
    case 'division':
      return `DIVISION  —  ${section.caption ?? ''}${section.timeMinutes ? `  (Time: ${section.timeMinutes} min)` : ''}`;
    default:
      return `ADDITION & SUBTRACTION  —  ${section.caption ?? ''}`;
  }
}

/**
 * Operand font size in source-image pixels. These are much larger than the
 * previous 5–7px values while still fitting inside a 25-column grid.
 */
export function operandFontPx(rows: number, isMulDiv: boolean): number {
  if (isMulDiv) return 12;
  if (rows >= 8) return 9.5;
  if (rows >= 7) return 10;
  if (rows >= 6) return 10.5;
  if (rows >= 5) return 12;
  return 12;
}
