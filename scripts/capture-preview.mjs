import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const out = process.argv[2] ?? 'C:\\Users\\swaro\\abacus-question-maker\\scripts\\preview-grade1.png';
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
  const box = await sheet.boundingBox();
  console.log(`Captured ${out} (${Math.round(box.width)}x${Math.round(box.height)})`);
} finally {
  await browser.close();
}
