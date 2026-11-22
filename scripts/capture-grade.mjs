import puppeteer from 'puppeteer-core';

const grade = Number(process.argv[2] ?? 1);
const out = process.argv[3] ?? `C:\\Users\\swaro\\abacus-question-maker\\scripts\\preview-grade${grade}.png`;

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
  // Select the grade chip.
  await page.evaluate((g) => {
    const chips = Array.from(document.querySelectorAll('.grade-chip'));
    const chip = chips.find((c) => c.textContent?.trim() === String(g));
    chip?.click();
  }, grade);
  await new Promise((r) => setTimeout(r, 200));
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Generate question papers'),
    );
    btn?.click();
  });
  await page.waitForSelector('.paper-sheet');
  await new Promise((r) => setTimeout(r, 500));
  const sheet = await page.$('.paper-sheet');
  await sheet.screenshot({ path: out });
  console.log(`Captured grade ${grade} -> ${out}`);
} finally {
  await browser.close();
}
