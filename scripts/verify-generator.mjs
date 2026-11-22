import { build } from 'esbuild';

const bundled = await build({
  entryPoints: ['src/lib/generator.ts', 'src/config/levels.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  outdir: 'out',
});
const source = bundled.outputFiles.map((f) => f.text).join('\n');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const { generatePaper } = await import(moduleUrl);

const gradeRules = [
  { grade: 1, sections: [{ type: 'addsub', count: 100, digits: 1, rows: 3 }] },
  { grade: 2, sections: [{ type: 'addsub', count: 100, digits: 2, rows: 5 }] },
  { grade: 3, sections: [{ type: 'addsub', count: 75, digits: 2, rows: 3 }, { type: 'multiplication', count: 25, digits: 2, operandDigits: 2 }] },
  { grade: 4, sections: [{ type: 'addsub', count: 75, digits: 2, rows: 5 }, { type: 'multiplication', count: 25, digits: 2, operandDigits: 2 }] },
  { grade: 5, sections: [{ type: 'addsub', count: 50, digits: 3, rows: 5 }, { type: 'multiplication', count: 25, digits: 3, operandDigits: 2 }, { type: 'division', count: 25, digits: 3, operandDigits: 2 }] },
  { grade: 6, sections: [{ type: 'addsub', count: 50, digits: 3, rows: 5 }, { type: 'multiplication', count: 25, digits: 4, operandDigits: 2 }, { type: 'division', count: 25, digits: 4, operandDigits: 2 }] },
  { grade: 7, sections: [{ type: 'addsub', count: 50, digits: 4, rows: 5 }, { type: 'multiplication', count: 25, digits: 4, operandDigits: 2 }, { type: 'division', count: 25, digits: 4, operandDigits: 2 }] },
  { grade: 8, sections: [{ type: 'addsub', count: 50, digits: 4, rows: 5 }, { type: 'multiplication', count: 25, digits: 4, operandDigits: 2 }, { type: 'division', count: 25, digits: 4, operandDigits: 2 }] },
];

let failures = 0;
for (const rule of gradeRules) {
  const paper = generatePaper(rule, 1, 12345);

  if (paper.questions.length !== 100) {
    console.log(`Grade ${rule.grade}: expected 100 questions, got ${paper.questions.length}`);
    failures += 1;
  }

  for (const section of paper.sections) {
    const signatures = new Set();
    for (const question of section.questions) {
      const signature = question.lines.map((line) => `${line.op ?? ''}${line.value}`).join(',');
      if (signatures.has(signature)) {
        console.log(`Grade ${rule.grade} ${section.rule.type}: duplicate ${signature}`);
        failures += 1;
      }
      signatures.add(signature);

      const computed = question.lines.reduce((total, line) => {
        if (line.op === '+') return total + line.value;
        if (line.op === '-') return total - line.value;
        if (line.op === '*') return total * line.value;
        if (line.op === '/') return total / line.value;
        return line.value;
      }, 0);
      if (computed !== question.answer) {
        console.log(`Grade ${rule.grade} ${section.rule.type}: answer mismatch`);
        failures += 1;
      }
      if (!Number.isInteger(question.answer)) {
        console.log(`Grade ${rule.grade} ${section.rule.type}: non-integer answer`);
        failures += 1;
      }

      // Verify operand digit rules for multiplication/division.
      if (section.rule.type === 'multiplication' || section.rule.type === 'division') {
        const second = Math.abs(question.lines[1].value);
        const expectedDigits = section.rule.operandDigits;
        const actualDigits = String(second).length;
        if (actualDigits !== expectedDigits) {
          console.log(`Grade ${rule.grade} ${section.rule.type}: second operand should be ${expectedDigits}-digit, got ${second} (${actualDigits})`);
          failures += 1;
        }
      }
    }
  }
}

console.log(failures === 0 ? 'Generator verification passed for all 8 grades.' : `${failures} problem(s) found.`);
process.exitCode = failures === 0 ? 0 : 1;
