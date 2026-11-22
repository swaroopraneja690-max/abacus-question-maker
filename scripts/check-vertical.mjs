import puppeteer from 'puppeteer-core';

const grades = process.argv.slice(2).map(Number).filter(Boolean);
if (grades.length === 0) grades.push(1, 2, 3, 4, 5, 6, 7, 8);

const SHEET_W = 1079;
const BLOCK_FIRST_LINES = [108, 236, 364, 492];
const BLOCK_BOTTOM_LINES = [218, 346, 474, 602];
const ANSWER_BAND = 18;

function geometry(block, rows) {
  const firstLine = BLOCK_FIRST_LINES[block];
  const bottom = BLOCK_BOTTOM_LINES[block];
  const answerTop = bottom - ANSWER_BAND;
  const step = (answerTop - firstLine) / rows;
  return { firstLine, step };
}

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1600,1000'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.generate-button');

  for (const grade of grades) {
    await page.evaluate((g) => {
      const chip = Array.from(document.querySelectorAll('.grade-chip')).find(
        (c) => c.textContent?.trim() === String(g),
      );
      chip?.click();
    }, grade);
    await new Promise((r) => setTimeout(r, 120));
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Generate question papers'),
      );
      btn?.click();
    });
    await page.waitForSelector('.preview-operand');

    const result = await page.evaluate(
      ({ sheetW, blocksFirst, blocksBottom, answerBand }) => {
        const sheet = document.querySelector('.paper-sheet');
        const operands = Array.from(document.querySelectorAll('.preview-operand'));
        const sheetRect = sheet.getBoundingClientRect();
        const scale = sheetRect.width / sheetW;

        let above = 0;
        let below = 0;
        let maxAbove = 0;
        let maxBelow = 0;
        const examples = [];

        for (const el of operands) {
          const block = Number(el.dataset.block);
          const row = Number(el.dataset.row);
          const section = el.dataset.section;
          const rows = section === 'addsub' ? el.parentElement.parentElement.querySelectorAll('.preview-operand[data-row]').length / 25 || 3 : 2;
          const firstLine = blocksFirst[block];
          const bottom = blocksBottom[block];
          const step = (bottom - answerBand - firstLine) / rows;
          const topLine = firstLine + row * step;
          const bottomLine = topLine + step;

          const rect = el.getBoundingClientRect();
          const top = (rect.top - sheetRect.top) / scale;
          const bottomEdge = (rect.bottom - sheetRect.top) / scale;
          const overTop = topLine - top;
          const overBottom = bottomEdge - bottomLine;

          if (overTop > 0.5) {
            above += 1;
            maxAbove = Math.max(maxAbove, overTop);
          }
          if (overBottom > 0.5) {
            below += 1;
            maxBelow = Math.max(maxBelow, overBottom);
          }
          if ((overTop > 0.5 || overBottom > 0.5) && examples.length < 5) {
            examples.push({
              text: el.textContent,
              block,
              row,
              overTopPx: Math.round(overTop * 10) / 10,
              overBottomPx: Math.round(overBottom * 10) / 10,
            });
          }
        }

        const captions = Array.from(document.querySelectorAll('.preview-section-caption'));
        const numbers = Array.from(document.querySelectorAll('.preview-number'));
        let captionOverlaps = 0;
        const captionExamples = [];

        for (const cap of captions) {
          const cr = cap.getBoundingClientRect();
          for (const num of numbers) {
            const nr = num.getBoundingClientRect();
            const overlapX = Math.min(cr.right, nr.right) - Math.max(cr.left, nr.left);
            const overlapY = Math.min(cr.bottom, nr.bottom) - Math.max(cr.top, nr.top);
            if (overlapX > 0.5 && overlapY > 0.5) {
              captionOverlaps += 1;
              if (captionExamples.length < 3) {
                captionExamples.push({
                  caption: cap.textContent,
                  number: num.textContent,
                  overlapYpx: Math.round((overlapY / scale) * 10) / 10,
                });
              }
            }
          }
        }

        return {
          operands: operands.length,
          above,
          below,
          maxAbovePx: Math.round(maxAbove * 10) / 10,
          maxBelowPx: Math.round(maxBelow * 10) / 10,
          examples,
          captionOverlaps,
          captionExamples,
        };
      },
      {
        sheetW: SHEET_W,
        blocksFirst: BLOCK_FIRST_LINES,
        blocksBottom: BLOCK_BOTTOM_LINES,
        answerBand: ANSWER_BAND,
      },
    );

    console.log(`Grade ${grade}: ${JSON.stringify(result)}`);
  }
} finally {
  await browser.close();
}
