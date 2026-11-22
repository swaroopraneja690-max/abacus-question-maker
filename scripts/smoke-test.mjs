import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';

const downloadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'abacus-smoke-'));
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const errors = [];

const waitForFile = async (predicate, timeout = 15000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const files = fs.readdirSync(downloadDir).filter((name) => !name.endsWith('.crdownload'));
    const match = files.find(predicate);
    if (match) return match;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return null;
};

const clickByText = async (page, text) => {
  const clicked = await page.evaluate((label) => {
    const button = Array.from(document.querySelectorAll('button')).find(
      (element) => element.textContent?.trim() === label,
    );
    if (!button) return false;
    button.click();
    return true;
  }, text);
  if (!clicked) throw new Error(`Button not found: ${text}`);
};

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1600,1000'],
});

try {
  const page = await browser.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

  const client = await page.createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadDir,
  });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.generate-button');

  await clickByText(page, '⚡ Generate question papers');
  await page.waitForSelector('.paper-sheet');
  const cells = await page.$$eval('.preview-number', (nodes) => nodes.length);
  console.log(`Preview cells: ${cells}`);

  await clickByText(page, 'Question PDF');
  console.log(`Question PDF: ${await waitForFile((name) => name.includes('Question') && name.endsWith('.pdf'))}`);

  await clickByText(page, 'Answer PDF');
  console.log(`Answer PDF: ${await waitForFile((name) => name.includes('AnswerKey') && name.endsWith('.pdf'))}`);

  await clickByText(page, 'Excel');
  console.log(`Excel: ${await waitForFile((name) => name.endsWith('.xlsx'))}`);

  // Build a small Excel file for the converter test.
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Test');
  sheet.getCell('A1').value = 'Hello';
  sheet.getCell('B1').value = 123;
  const buffer = await workbook.xlsx.writeBuffer();
  const testXlsx = path.join(downloadDir, 'converter-test.xlsx');
  fs.writeFileSync(testXlsx, Buffer.from(buffer));

  await clickByText(page, 'Word / Excel → PDF');
  await page.waitForSelector('input[type=file]');
  const input = await page.$('input[type=file]');
  await input.uploadFile(testXlsx);
  await page.waitForSelector('.file-table tbody tr');
  await clickByText(page, 'Convert');
  console.log(`Converted PDF: ${await waitForFile((name) => name.includes('converter-test.pdf'))}`);

  // Build a minimal .docx to verify the Word conversion path.
  const docx = new JSZip();
  docx.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  );
  docx.file(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  );
  docx.file(
    'word/document.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Hello from Word test</w:t></w:r></w:p><w:p><w:r><w:t>Second line 12345</w:t></w:r></w:p></w:body></w:document>',
  );
  const docxBuffer = await docx.generateAsync({ type: 'nodebuffer' });
  const testDocx = path.join(downloadDir, 'word-test.docx');
  fs.writeFileSync(testDocx, docxBuffer);
  const docxInput = await page.$('input[type=file]');
  await docxInput.uploadFile(testDocx);
  await page.evaluate(() => {
    const rows = document.querySelectorAll('.file-table tbody tr');
    const lastRow = rows[rows.length - 1];
    const button = lastRow?.querySelector('button');
    button?.click();
  });
  console.log(`Converted DOCX: ${await waitForFile((name) => name.includes('word-test.pdf'))}`);

  console.log(`Errors: ${errors.length}`);
  errors.slice(0, 10).forEach((error) => console.log(`  ${error}`));
  process.exitCode = errors.length === 0 ? 0 : 1;
} catch (error) {
  console.error(`SMOKE TEST FAILED: ${error.message}`);
  errors.forEach((item) => console.error(item));
  process.exitCode = 1;
} finally {
  await browser.close();
}
