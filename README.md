# Abacus Question Paper Maker

A locally hosted web app for generating abacus question papers (Grades 1–8) with answer keys and Excel export, plus offline Word/Excel → PDF conversion. Everything runs in the browser — no uploads, no server-side processing, and no internet required after setup.

## Setup (one time)

```powershell
cd C:\Users\swaro\abacus-question-maker
npm.cmd install
```

## Run

```powershell
npm.cmd run dev
```

Open http://127.0.0.1:5173 in Chrome or Edge.

## Deploy to Vercel

This app is fully client-side, so Vercel only needs the static `dist` output. No environment variables or backend are required.

### Option A — GitHub import (recommended)

1. Push this folder to a GitHub repository.
2. Go to https://vercel.com/new and choose **Import Git Repository**.
3. Select the repository.
4. Vercel will detect Vite. Confirm:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Click **Deploy**.
6. Open the `*.vercel.app` URL Vercel gives you.

`vercel.json` and `.vercelignore` are already included, so no extra Vercel settings are needed.

### Option B — Vercel CLI

```powershell
cd C:\Users\swaro\abacus-question-maker
npx vercel login
npx vercel --prod
```

Use the same command again after making changes to publish a new production version.

## Features

### Question paper generator
- Choose a grade (1–8) and how many papers to generate (1–20).
- Optional **seed**: reuse the same seed to reproduce an identical paper.
- Each paper produces:
  - `Grade_X_Model_Y_Question.pdf` — A4 landscape, sample-style layout
  - `Grade_X_Model_Y_AnswerKey.pdf` — same layout, answers filled
  - `Grade_X_Model_Y_Question.xlsx` — Excel version with a second **Answer Key** sheet
- “Download all (ZIP)” bundles every paper’s three files.

### Word / Excel → PDF
- Drop `.docx`, `.xlsx`, `.xls` or `.csv` files.
- Convert one at a time or all at once into a ZIP of PDFs.

## Original-paper format

The generator follows the separated-section format found in the source papers:

- **Addition & Subtraction** stays together in its own section/blocks.
- **Multiplication** is generated and printed as a separate section.
- **Division** is generated and printed as a separate section.
- Operations are never randomly scattered within one grid.
- Question numbers continue across the four 25-column blocks: 1–100.
- All multiplication and division multipliers/divisors from Grade 3 upward are **2-digit**.
- Operand font sizes are scaled up and each row is vertically centred so numbers stay readable and inside their own row and column.

### Grade rules

| Grade | Addition / Subtraction | Multiplication | Division |
| --- | --- | --- | --- |
| 1 | 1 digit, 3 rows, 100 Q | — | — |
| 2 | 2 digit, 5 rows, 100 Q | — | — |
| 3 | 2 digit, 3 rows, 75 Q | 2 digit × 2 digit, 25 Q | — |
| 4 | 2 digit, 5 rows, 75 Q | 2 digit × 2 digit, 25 Q | — |
| 5 | 3 digit, 5 rows, 50 Q | 3 digit × 2 digit, 25 Q | 3 digit ÷ 2 digit, 25 Q |
| 6 | 3 digit, 5 rows, 50 Q | 4 digit × 2 digit, 25 Q | 4 digit ÷ 2 digit, 25 Q |
| 7 | 4 digit, 5 rows, 50 Q | 4 digit × 2 digit, 25 Q | 4 digit ÷ 2 digit, 25 Q |
| 8 | 4 digit, 5 rows, 50 Q | 4 digit × 2 digit, 25 Q | 4 digit ÷ 2 digit, 25 Q |

## Changing the grade rules

Edit `src/config/levels.ts`. Each level has a `sections` array. Each section controls:

| Field | Meaning |
| --- | --- |
| `type` | `addsub`, `multiplication`, or `division` |
| `count` | Number of questions in that section |
| `digits` | Digits in the first operand (or each operand for add/sub chains) |
| `operandDigits` | Digits in the multiplier/divisor |
| `rows` | Number of stacked rows for addition/subtraction |
| `operations` | Operators allowed in add/sub chains (`+`, `-`) |
| `caption` | Caption printed above the section grid |
| `timeMinutes` | Optional section time limit |
| `timeMinutes` / `marksPerQuestion` / `totalMarks` on the level | Header information |

## Notes

- Division problems are always exact (no remainders).
- The question layout uses the measured original geometry: A4 landscape, 25 columns × 4 blocks = 100 questions, header with group/marks/time/sign lines, and a blank `Ans` row.
- The offline Word/Excel converter preserves content and basic formatting; very complex Office layouts (macros, charts, exact page breaks) may not look identical.

## Verification

```powershell
npm.cmd run build
npm.cmd run test:generator
node scripts/smoke-test.mjs
node scripts/check-grid.mjs 4 5 6 8
node scripts/check-vertical.mjs 1 6 7 8
```
