import type { LevelRule } from '../types';

/**
 * Level rules based on the original sample papers.
 *
 * Layout principle taken from the samples (especially Term 7 -3 and Levels 4–6):
 *  - Addition/Subtraction questions are generated as stacked chains and kept
 *    together in their own section.
 *  - Multiplication and Division are SEPARATE sections with their own grids,
 *    never mixed into the addition/subtraction chains.
 *  - From Level 3 upward the multiplier/divisor is always a 2-digit number.
 */
export const LEVELS: LevelRule[] = [
  {
    grade: 1,
    label: 'Grade 1',
    headerTitle: 'MOCK TEST',
    timeMinutes: 30,
    marksPerQuestion: 1,
    totalMarks: 100,
    sections: [
      {
        type: 'addsub',
        count: 100,
        digits: 1,
        rows: 3,
        operations: ['+', '-'],
        caption: '1 Digit - 3 Rows',
      },
    ],
  },
  {
    grade: 2,
    label: 'Grade 2',
    headerTitle: 'MOCK TEST',
    timeMinutes: 20,
    marksPerQuestion: 1,
    totalMarks: 100,
    sections: [
      {
        type: 'addsub',
        count: 100,
        digits: 2,
        rows: 5,
        operations: ['+', '-'],
        caption: '2 Digit - 5 Rows',
      },
    ],
  },
  {
    grade: 3,
    label: 'Grade 3',
    headerTitle: 'MODEL PAPER',
    timeMinutes: 20,
    marksPerQuestion: 1,
    totalMarks: 100,
    sections: [
      {
        type: 'addsub',
        count: 75,
        digits: 2,
        rows: 3,
        operations: ['+', '-'],
        caption: '2 Digit - 3 Rows',
      },
      {
        type: 'multiplication',
        count: 25,
        digits: 2,
        operandDigits: 2,
        caption: '2 Digit X 2 Digit',
        timeMinutes: 5,
      },
    ],
  },
  {
    grade: 4,
    label: 'Grade 4',
    headerTitle: 'MODEL PAPER',
    timeMinutes: 20,
    marksPerQuestion: 1,
    totalMarks: 100,
    sections: [
      {
        type: 'addsub',
        count: 75,
        digits: 2,
        rows: 5,
        operations: ['+', '-'],
        caption: '2 Digit - 5 Rows',
      },
      {
        type: 'multiplication',
        count: 25,
        digits: 2,
        operandDigits: 2,
        caption: '2 Digit X 2 Digit',
        timeMinutes: 5,
      },
    ],
  },
  {
    grade: 5,
    label: 'Grade 5',
    headerTitle: 'MODEL PAPER',
    timeMinutes: 20,
    marksPerQuestion: 1,
    totalMarks: 100,
    sections: [
      {
        type: 'addsub',
        count: 50,
        digits: 3,
        rows: 5,
        operations: ['+', '-'],
        caption: '3 Digit - 5 Rows',
      },
      {
        type: 'multiplication',
        count: 25,
        digits: 3,
        operandDigits: 2,
        caption: '3 Digit X 2 Digit',
        timeMinutes: 3,
      },
      {
        type: 'division',
        count: 25,
        digits: 3,
        operandDigits: 2,
        caption: '3 Digit ÷ 2 Digit',
        timeMinutes: 3,
      },
    ],
  },
  {
    grade: 6,
    label: 'Grade 6',
    headerTitle: 'MODEL PAPER',
    timeMinutes: 20,
    marksPerQuestion: 1,
    totalMarks: 100,
    sections: [
      {
        type: 'addsub',
        count: 50,
        digits: 3,
        rows: 5,
        operations: ['+', '-'],
        caption: '3 Digit - 5 Rows',
      },
      {
        type: 'multiplication',
        count: 25,
        digits: 4,
        operandDigits: 2,
        caption: '4 Digit X 2 Digit',
        timeMinutes: 3,
      },
      {
        type: 'division',
        count: 25,
        digits: 4,
        operandDigits: 2,
        caption: '4 Digit ÷ 2 Digit',
        timeMinutes: 3,
      },
    ],
  },
  {
    grade: 7,
    label: 'Grade 7',
    headerTitle: 'MODEL PAPER',
    timeMinutes: 20,
    marksPerQuestion: 1,
    totalMarks: 100,
    sections: [
      {
        type: 'addsub',
        count: 50,
        digits: 4,
        rows: 5,
        operations: ['+', '-'],
        caption: '4 Digit - 5 Rows',
      },
      {
        type: 'multiplication',
        count: 25,
        digits: 4,
        operandDigits: 2,
        caption: '4 Digit X 2 Digit',
        timeMinutes: 3,
      },
      {
        type: 'division',
        count: 25,
        digits: 4,
        operandDigits: 2,
        caption: '4 Digit ÷ 2 Digit',
        timeMinutes: 3,
      },
    ],
  },
  {
    grade: 8,
    label: 'Grade 8',
    headerTitle: 'MODEL PAPER',
    timeMinutes: 20,
    marksPerQuestion: 1,
    totalMarks: 100,
    sections: [
      {
        type: 'addsub',
        count: 50,
        digits: 4,
        rows: 5,
        operations: ['+', '-'],
        caption: '4 Digit - 5 Rows',
      },
      {
        type: 'multiplication',
        count: 25,
        digits: 4,
        operandDigits: 2,
        caption: '4 Digit X 2 Digit',
        timeMinutes: 3,
      },
      {
        type: 'division',
        count: 25,
        digits: 4,
        operandDigits: 2,
        caption: '4 Digit ÷ 2 Digit',
        timeMinutes: 3,
      },
    ],
  },
];

export function getLevel(grade: number): LevelRule {
  const level = LEVELS.find((l) => l.grade === grade);
  if (!level) throw new Error(`Unknown grade: ${grade}`);
  return level;
}
