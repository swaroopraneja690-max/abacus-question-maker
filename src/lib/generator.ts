import type { LevelRule, Paper, Question, SectionRule } from '../types';
import { Rng } from './random';

function numberForDigits(rng: Rng, digits: number, allowZero = false): number {
  const min = digits <= 1 ? (allowZero ? 0 : 1) : Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return rng.int(min, max);
}

function makeChain(section: SectionRule, rng: Rng): Question {
  const rows = section.rows ?? 3;
  const lines: Question['lines'] = [];
  const ops = section.operations ?? ['+', '-'];
  let running = numberForDigits(rng, section.digits);
  lines.push({ value: running, op: null });

  for (let i = 1; i < rows; i += 1) {
    let op = rng.pick(ops);
    let value = numberForDigits(rng, section.digits);

    // Keep the running total within a reasonable range and avoid -0 style.
    if (op === '-' && running - value < 0) {
      op = '+';
    }
    if (op === '-' && value === 0) value = 1;

    running = op === '+' ? running + value : running - value;
    lines.push({ value, op });
  }

  return { number: 0, section: 'addsub', lines, answer: running };
}

function makeMultiplication(section: SectionRule, rng: Rng): Question {
  const a = numberForDigits(rng, section.digits);
  const bDigits = section.operandDigits ?? 2;
  const b = numberForDigits(rng, bDigits);

  return {
    number: 0,
    section: 'multiplication',
    lines: [
      { value: a, op: null },
      { value: b, op: '*' },
    ],
    answer: a * b,
  };
}

function makeDivision(section: SectionRule, rng: Rng): Question {
  const bDigits = section.operandDigits ?? 2;
  const divisor = numberForDigits(rng, bDigits);
  // Pick a quotient so that dividend has the requested number of digits.
  const minDividend = section.digits <= 1 ? 1 : Math.pow(10, section.digits - 1);
  const maxDividend = Math.pow(10, section.digits) - 1;
  const minQ = Math.max(1, Math.ceil(minDividend / divisor));
  const maxQ = Math.max(minQ, Math.floor(maxDividend / divisor));
  const quotient = rng.int(minQ, maxQ);
  const dividend = divisor * quotient;

  return {
    number: 0,
    section: 'division',
    lines: [
      { value: dividend, op: null },
      { value: divisor, op: '/' },
    ],
    answer: quotient,
  };
}

function makeQuestion(section: SectionRule, rng: Rng): Question {
  if (section.type === 'multiplication') return makeMultiplication(section, rng);
  if (section.type === 'division') return makeDivision(section, rng);
  return makeChain(section, rng);
}

function signature(question: Question): string {
  return `${question.section}|${question.lines.map((line) => `${line.op ?? ''}${line.value}`).join(',')}`;
}

function generateSection(section: SectionRule, rng: Rng): Question[] {
  const questions: Question[] = [];
  const seen = new Set<string>();
  const maxAttempts = section.count * 80;
  let attempts = 0;

  while (questions.length < section.count && attempts < maxAttempts) {
    attempts += 1;
    const question = makeQuestion(section, rng);
    const sig = signature(question);
    if (seen.has(sig)) continue;
    seen.add(sig);
    question.number = questions.length + 1;
    questions.push(question);
  }

  return questions;
}

export function generatePaper(rule: LevelRule, modelNo: number, seed: number): Paper {
  const rng = new Rng(seed);
  const sections = rule.sections.map((sectionRule) => ({
    rule: sectionRule,
    questions: generateSection(sectionRule, rng),
  }));

  // Flatten for convenience; keep per-section numbering intact.
  const questions = sections.flatMap((section) => section.questions);

  return {
    grade: rule.grade,
    modelNo,
    rule,
    questions,
    sections,
    seed,
  };
}

export function generatePapers(rule: LevelRule, count: number, seed: number): Paper[] {
  return Array.from({ length: count }, (_, index) =>
    generatePaper(rule, index + 1, (seed + index * 7919) >>> 0),
  );
}
