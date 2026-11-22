export type Operation = '+' | '-' | '*' | '/';
export type SectionType = 'addsub' | 'multiplication' | 'division';

export interface LevelRule {
  grade: number;
  label: string;
  /** Wording used in the header, taken from the original samples. */
  headerTitle: string;
  timeMinutes: number;
  marksPerQuestion: number;
  totalMarks: number;
  sections: SectionRule[];
}

export interface SectionRule {
  type: SectionType;
  /** How many questions belong to this section. */
  count: number;
  /** Digits in the first operand (or each operand for add/sub chains). */
  digits: number;
  /** Digits in the second operand for multiplication/division. */
  operandDigits?: number;
  /** Number of stacked rows for addition/subtraction chains. */
  rows?: number;
  /** Operators allowed in add/sub chains. */
  operations?: ('+' | '-')[];
  /** Small caption printed under the section, e.g. "2 Digit X 2 Digit". */
  caption?: string;
  /** Optional per-section time limit (printed in the section header). */
  timeMinutes?: number;
}

export interface QuestionLine {
  value: number;
  /** Operator printed to the left of this line. Null for the first line. */
  op: Operation | null;
}

export interface Question {
  number: number;
  section: SectionType;
  lines: QuestionLine[];
  answer: number;
}

export interface Paper {
  grade: number;
  modelNo: number;
  rule: LevelRule;
  questions: Question[];
  /** Questions grouped by section, for section-based rendering. */
  sections: {
    rule: SectionRule;
    questions: Question[];
  }[];
  seed: number;
}
