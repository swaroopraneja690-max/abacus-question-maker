import puppeteer from 'puppeteer-core';

const grades = process.argv.slice(2).map(Number).filter(Boolean);
if (grades.length === 0) grades.push(1, 2, 3, 4, 5, 6, 7, 8);

const VERTICAL_LINES = [
  11, 50, 90, 130, 170, 209, 249, 289, 329, 369, 408, 448, 488, 528, 567,
  607, 647, 687, 727, 766, 806, 846, 886, 926, 965, 1005, 1045,
];
const SHEET_W = 1079;
const BLOCK_FIRST_LINES = [108, 236, 364, 492];
const BLOCK_BOTTOM_LINES = [218, 346, 474, 602];

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
      ({ verticalLines, sheetW }) => {
        const sheet = document.querySelector('.paper-sheet');
        const operands = Array.from(document.querySelectorAll('.preview-operand'));
        const sheetRect = sheet.getBoundingClientRect();
        const scale = sheetRect.width / sheetW;
        const boundary = (x) => sheetRect.left + x * scale;

        let leftOverflow = 0;
        let rightOverflow = 0;
        let maxLeftOverflowPx = 0;
        let maxRightOverflowPx = 0;
        const examples = [];

        for (const el of operands) {
          const col = Number(el.dataset.col);
          const rect = el.getBoundingClientRect();
          const leftBound = boundary(verticalLines[col + 1]);
          const rightBound = boundary(verticalLines[col + 2]);
          const leftOver = leftBound - rect.left;
          const rightOver = rect.right - rightBound;

          if (leftOver > 0.5) {
            leftOverflow += 1;
            maxLeftOverflowPx = Math.max(maxLeftOverflowPx, leftOver);
          }
          if (rightOver > 0.5) {
            rightOverflow += 1;
            maxRightOverflowPx = Math.max(maxRightOverflowPx, rightOver);
          }
          if ((leftOver > 0.5 || rightOver > 0.5) && examples.length < 5) {
            examples.push({
              text: el.textContent,
              col: col + 1,
              leftOverPx: Math.round(leftOver * 10) / 10,
              rightOverPx: Math.round(rightOver * 10) / 10,
            });
          }
        }

        return {
          operands: operands.length,
          leftOverflow,
          rightOverflow,
          maxLeftOverflowPx: Math.round(maxLeftOverflowPx * 10) / 10,
          maxRightOverflowPx: Math.round(maxRightOverflowPx * 10) / 10,
          examples,
          captions: Array.from(document.querySelectorAll('.preview-section-caption')).map(
            (el) => el.textContent,
          ),
        };
      },
      { verticalLines: VERTICAL_LINES, sheetW: SHEET_W },
    );

    console.log(`Grade ${grade}: ${JSON.stringify(result)}`);
  }
} finally {
  await browser.close();
}
